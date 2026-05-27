import client from './client'
import type { Course, CreateCourseRequest, UpdateCourseRequest } from '../types/course'

export async function listCourses(): Promise<Course[]> {
  const res = await client.get<Course[]>('/courses')
  return res.data
}

export async function createCourse(data: CreateCourseRequest): Promise<Course> {
  const res = await client.post<Course>('/courses', data)
  return res.data
}

export async function updateCourse(id: number, data: UpdateCourseRequest): Promise<Course> {
  const res = await client.put<Course>(`/courses/${id}`, data)
  return res.data
}

export async function deleteCourse(id: number): Promise<void> {
  await client.delete(`/courses/${id}`)
}
