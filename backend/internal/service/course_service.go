package service

import (
	"errors"

	"github.com/ai-note-student/backend/internal/model"
	"github.com/ai-note-student/backend/internal/repository"
	"gorm.io/gorm"
)

type CourseService struct {
	courseRepo *repository.CourseRepository
}

func NewCourseService(courseRepo *repository.CourseRepository) *CourseService {
	return &CourseService{courseRepo: courseRepo}
}

type CreateCourseRequest struct {
	Name        string `json:"name" binding:"required,min=1,max=100"`
	Description string `json:"description" binding:"max=500"`
	Color       string `json:"color" binding:"max=7"`
}

type UpdateCourseRequest struct {
	Name        string `json:"name" binding:"max=100"`
	Description string `json:"description" binding:"max=500"`
	Color       string `json:"color" binding:"max=7"`
	SortOrder   *int   `json:"sort_order"`
}

func (s *CourseService) List(userID uint) ([]model.Course, error) {
	return s.courseRepo.FindByUserID(userID)
}

func (s *CourseService) Create(userID uint, req CreateCourseRequest) (*model.Course, error) {
	course := &model.Course{
		UserID:      userID,
		Name:        req.Name,
		Description: req.Description,
		Color:       req.Color,
	}
	if err := s.courseRepo.Create(course); err != nil {
		return nil, err
	}
	return course, nil
}

func (s *CourseService) Update(userID uint, courseID uint, req UpdateCourseRequest) (*model.Course, error) {
	course, err := s.courseRepo.FindByID(courseID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("course not found")
		}
		return nil, err
	}
	if course.UserID != userID {
		return nil, errors.New("permission denied")
	}

	if req.Name != "" {
		course.Name = req.Name
	}
	if req.Description != "" {
		course.Description = req.Description
	}
	if req.Color != "" {
		course.Color = req.Color
	}
	if req.SortOrder != nil {
		course.SortOrder = *req.SortOrder
	}

	if err := s.courseRepo.Update(course); err != nil {
		return nil, err
	}
	return course, nil
}

func (s *CourseService) Delete(userID uint, courseID uint) error {
	course, err := s.courseRepo.FindByID(courseID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("course not found")
		}
		return err
	}
	if course.UserID != userID {
		return errors.New("permission denied")
	}
	return s.courseRepo.Delete(courseID)
}
