package repository

import (
	"github.com/ai-note-student/backend/internal/model"
	"gorm.io/gorm"
)

type CourseRepository struct {
	db *gorm.DB
}

func NewCourseRepository(db *gorm.DB) *CourseRepository {
	return &CourseRepository{db: db}
}

func (r *CourseRepository) Create(course *model.Course) error {
	return r.db.Create(course).Error
}

func (r *CourseRepository) FindByUserID(userID uint) ([]model.Course, error) {
	var courses []model.Course
	err := r.db.Where("user_id = ?", userID).Order("sort_order ASC, created_at DESC").Find(&courses).Error
	return courses, err
}

func (r *CourseRepository) FindByID(id uint) (*model.Course, error) {
	var course model.Course
	if err := r.db.First(&course, id).Error; err != nil {
		return nil, err
	}
	return &course, nil
}

func (r *CourseRepository) Update(course *model.Course) error {
	return r.db.Save(course).Error
}

func (r *CourseRepository) Delete(id uint) error {
	return r.db.Delete(&model.Course{}, id).Error
}
