package service

import (
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/ai-note-student/backend/internal/model"
	"github.com/ai-note-student/backend/internal/repository"
)

type ReviewService struct {
	reviewRepo    *repository.ReviewPlanRepository
	examPointRepo *repository.ExamPointRepository
	wqRepo        *repository.WrongQuestionRepository
	noteRepo      *repository.NoteRepository
}

func NewReviewService(
	reviewRepo *repository.ReviewPlanRepository,
	examPointRepo *repository.ExamPointRepository,
	wqRepo *repository.WrongQuestionRepository,
	noteRepo *repository.NoteRepository,
) *ReviewService {
	return &ReviewService{
		reviewRepo:    reviewRepo,
		examPointRepo: examPointRepo,
		wqRepo:        wqRepo,
		noteRepo:      noteRepo,
	}
}

// DTOs
type ReviewItemDTO struct {
	PlanID       uint   `json:"plan_id"`
	RefType      string `json:"ref_type"`
	RefID        uint   `json:"ref_id"`
	NoteID       uint   `json:"note_id"`
	NoteTitle    string `json:"note_title"`
	Content      string `json:"content"`
	Answer       string `json:"answer,omitempty"`
	NextReviewAt string `json:"next_review_at"`
	IntervalDays int    `json:"interval_days"`
	ReviewCount  int    `json:"review_count"`
	Mastery      int    `json:"mastery"`
}

type AnswerReviewRequest struct {
	Quality int `json:"quality" binding:"min=0,max=5"`
}

type ReviewStatsDTO struct {
	DueToday          int            `json:"due_today"`
	CompletedToday    int            `json:"completed_today"`
	TotalItems        int64          `json:"total_items"`
	StreakDays        int            `json:"streak_days"`
	MasteryDistribution map[string]int `json:"mastery_distribution"`
}

type DetailedStatsDTO struct {
	TotalNotes           int              `json:"total_notes"`
	TotalExamPoints      int              `json:"total_exam_points"`
	TotalWrongQuestions   int64            `json:"total_wrong_questions"`
	TotalReviewPlans     int64            `json:"total_review_plans"`
	DueToday             int              `json:"due_today"`
	CompletedToday       int64            `json:"completed_today"`
	StreakDays           int              `json:"streak_days"`
	ErrorTypeDistribution map[string]int  `json:"error_type_distribution"`
	FrequencyDistribution map[string]int  `json:"frequency_distribution"`
	MasteryDistribution   map[string]int  `json:"mastery_distribution"`
	RecentReviews        []DailyReviewCount `json:"recent_reviews"`
}

type DailyReviewCount struct {
	Date  string `json:"date"`
	Count int    `json:"count"`
}

func (s *ReviewService) GetTodayReviews(userID uint) ([]ReviewItemDTO, error) {
	plans, err := s.reviewRepo.FindTodayByUserID(userID)
	if err != nil {
		return nil, err
	}

	items := make([]ReviewItemDTO, 0, len(plans))
	for _, plan := range plans {
		item := ReviewItemDTO{
			PlanID:       plan.ID,
			RefType:      plan.RefType,
			RefID:        plan.RefID,
			NoteID:       plan.NoteID,
			NextReviewAt: plan.NextReviewAt.Format("2006-01-02T15:04:05Z"),
			IntervalDays: plan.IntervalDays,
			ReviewCount:  plan.ReviewCount,
		}

		// Get note title
		note, err := s.noteRepo.FindByID(plan.NoteID)
		if err == nil {
			item.NoteTitle = note.Title
		}

		// Get content and mastery based on ref type
		switch plan.RefType {
		case "exam_point":
			ep, err := s.examPointRepo.FindByID(plan.RefID)
			if err == nil {
				item.Content = ep.Content
			}
		case "wrong_question":
			wq, err := s.wqRepo.FindByID(plan.RefID)
			if err == nil {
				item.Content = wq.Question
				item.Answer = wq.Answer
				item.Mastery = wq.Mastery
			}
		}

		items = append(items, item)
	}

	return items, nil
}

func (s *ReviewService) AnswerReview(userID uint, planID uint, req AnswerReviewRequest) (*ReviewItemDTO, error) {
	plan, err := s.reviewRepo.FindByID(planID)
	if err != nil {
		return nil, errors.New("review plan not found")
	}
	if plan.UserID != userID {
		return nil, errors.New("permission denied")
	}

	// Calculate SM-2
	result := CalculateSM2(SM2Input{
		Quality:    req.Quality,
		Interval:   plan.IntervalDays,
		Repetition: plan.ReviewCount,
		EaseFactor: plan.EaseFactor,
	})

	// Update plan
	plan.IntervalDays = result.Interval
	plan.ReviewCount = result.Repetition
	plan.EaseFactor = result.EaseFactor
	plan.NextReviewAt = time.Now().Add(time.Duration(result.Interval) * 24 * time.Hour)
	now := time.Now()
	plan.LastAnsweredAt = &now

	if err := s.reviewRepo.Update(plan); err != nil {
		return nil, err
	}

	// Update mastery on the referenced item
	switch plan.RefType {
	case "wrong_question":
		wq, err := s.wqRepo.FindByID(plan.RefID)
		if err == nil {
			wq.Mastery = req.Quality
			s.wqRepo.Update(wq)
		}
	}

	// Return updated item
	return s.GetReviewItem(plan)
}

func (s *ReviewService) GetReviewItem(plan *model.ReviewPlan) (*ReviewItemDTO, error) {
	item := &ReviewItemDTO{
		PlanID:       plan.ID,
		RefType:      plan.RefType,
		RefID:        plan.RefID,
		NoteID:       plan.NoteID,
		NextReviewAt: plan.NextReviewAt.Format("2006-01-02T15:04:05Z"),
		IntervalDays: plan.IntervalDays,
		ReviewCount:  plan.ReviewCount,
	}

	note, err := s.noteRepo.FindByID(plan.NoteID)
	if err == nil {
		item.NoteTitle = note.Title
	}

	switch plan.RefType {
	case "exam_point":
		ep, err := s.examPointRepo.FindByID(plan.RefID)
		if err == nil {
			item.Content = ep.Content
		}
	case "wrong_question":
		wq, err := s.wqRepo.FindByID(plan.RefID)
		if err == nil {
			item.Content = wq.Question
			item.Answer = wq.Answer
			item.Mastery = wq.Mastery
		}
	}

	return item, nil
}

func (s *ReviewService) GetStats(userID uint) (*ReviewStatsDTO, error) {
	dueToday, _ := s.reviewRepo.CountDueByUserID(userID)
	completedToday, _ := s.reviewRepo.CountCompletedTodayByUserID(userID)
	total, _ := s.reviewRepo.CountByUserID(userID)

	// Calculate mastery distribution from wrong questions
	masteryDist := make(map[string]int)
	for m := 0; m <= 5; m++ {
		items, err := s.wqRepo.FindByUserIDAndMastery(userID, m)
		if err == nil {
			masteryDist[fmt.Sprintf("%d", m)] = len(items)
		}
	}

	// Calculate streak (simplified: count consecutive days with reviews from today backwards)
	streak := 0
	recentCounts, _ := s.reviewRepo.FindRecentReviewCounts(userID, 30)
	countMap := make(map[string]int)
	for _, rc := range recentCounts {
		countMap[rc.Date.Format("2006-01-02")] = int(rc.Count)
	}
	now := time.Now()
	for i := 0; i < 30; i++ {
		date := now.AddDate(0, 0, -i).Format("2006-01-02")
		if countMap[date] > 0 {
			streak++
		} else if i > 0 { // skip today if no reviews yet
			break
		}
	}

	return &ReviewStatsDTO{
		DueToday:            int(dueToday),
		CompletedToday:      int(completedToday),
		TotalItems:          total,
		StreakDays:          streak,
		MasteryDistribution: masteryDist,
	}, nil
}

func (s *ReviewService) GetDetailedStats(userID uint) (*DetailedStatsDTO, error) {
	stats := &DetailedStatsDTO{}

	// Basic stats
	dueToday, _ := s.reviewRepo.CountDueByUserID(userID)
	completedToday, _ := s.reviewRepo.CountCompletedTodayByUserID(userID)
	totalPlans, _ := s.reviewRepo.CountByUserID(userID)

	stats.DueToday = int(dueToday)
	stats.CompletedToday = completedToday
	stats.TotalReviewPlans = totalPlans

	// Wrong question stats
	totalWQ, _ := s.wqRepo.CountByUserID(userID)
	stats.TotalWrongQuestions = totalWQ

	errorTypeDist, _ := s.wqRepo.CountByErrorType(userID)
	stats.ErrorTypeDistribution = errorTypeDist

	// Mastery distribution
	masteryDist := make(map[string]int)
	for m := 0; m <= 5; m++ {
		items, err := s.wqRepo.FindByUserIDAndMastery(userID, m)
		if err == nil {
			masteryDist[fmt.Sprintf("%d", m)] = len(items)
		}
	}
	stats.MasteryDistribution = masteryDist

	// Note stats
	notes, _ := s.noteRepo.FindByUserID(userID)
	stats.TotalNotes = len(notes)

	// Exam point stats
	totalEP := 0
	freqDist := make(map[string]int)
	for _, note := range notes {
		eps, err := s.examPointRepo.FindByNoteID(note.ID)
		if err == nil {
			totalEP += len(eps)
			for _, ep := range eps {
				freqDist[ep.Frequency]++
			}
		}
	}
	stats.TotalExamPoints = totalEP
	stats.FrequencyDistribution = freqDist

	// Streak
	streak := 0
	recentCounts, _ := s.reviewRepo.FindRecentReviewCounts(userID, 30)
	countMap := make(map[string]int)
	now := time.Now()
	for _, rc := range recentCounts {
		countMap[rc.Date.Format("2006-01-02")] = int(rc.Count)
	}
	for i := 0; i < 30; i++ {
		date := now.AddDate(0, 0, -i).Format("2006-01-02")
		if countMap[date] > 0 {
			streak++
		} else if i > 0 {
			break
		}
	}
	stats.StreakDays = streak

	// Recent 7 days
	stats.RecentReviews = make([]DailyReviewCount, 7)
	for i := 6; i >= 0; i-- {
		date := now.AddDate(0, 0, -i)
		dateStr := date.Format("2006-01-02")
		stats.RecentReviews[6-i] = DailyReviewCount{
			Date:  dateStr,
			Count: countMap[dateStr],
		}
	}

	_ = json.Marshal // avoid unused import
	return stats, nil
}

func (s *ReviewService) CreatePlanForExamPoint(userID uint, noteID uint, examPointID uint) error {
	// Check if plan already exists
	existing, err := s.reviewRepo.FindByUserAndRef(userID, "exam_point", examPointID)
	if err == nil && existing != nil {
		return nil // already exists, skip
	}

	plan := &model.ReviewPlan{
		UserID:       userID,
		NoteID:       noteID,
		RefType:      "exam_point",
		RefID:        examPointID,
		NextReviewAt: time.Now(),
		IntervalDays: 1,
		ReviewCount:  0,
		EaseFactor:   2.5,
	}

	return s.reviewRepo.Create(plan)
}

func (s *ReviewService) CreatePlanForWrongQuestion(userID uint, noteID uint, wqID uint) error {
	// If noteID is 0, try to get it from the wrong question
	if noteID == 0 {
		wq, err := s.wqRepo.FindByID(wqID)
		if err == nil && wq.NoteID != nil {
			noteID = *wq.NoteID
		}
	}

	// Check if plan already exists
	existing, err := s.reviewRepo.FindByUserAndRef(userID, "wrong_question", wqID)
	if err == nil && existing != nil {
		return nil
	}

	plan := &model.ReviewPlan{
		UserID:       userID,
		NoteID:       noteID,
		RefType:      "wrong_question",
		RefID:        wqID,
		NextReviewAt: time.Now(),
		IntervalDays: 1,
		ReviewCount:  0,
		EaseFactor:   2.5,
	}

	return s.reviewRepo.Create(plan)
}
