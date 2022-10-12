import { TodoAccess } from './todosAcess'
//import { AttachmentUtils } from './attachmentUtils'
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
//import { createLogger } from '../utils/logger'
import * as uuid from 'uuid'
//import * as createError from 'http-errors'

// TODO: Implement businessLogic

const todoAccess = new TodoAccess()
const bucketName = process.env.ATTACHMENT_S3_BUCKET

export const createTodo = async (
  todo: CreateTodoRequest,
  userId: string
): Promise<TodoItem> => {
  const todoId = uuid.v4()
  const timestamp = Date.now()

  const todoItem = {
    userId: userId,
    todoId: todoId,
    name: todo.name,
    dueDate: todo.dueDate,
    done: false,
    createdAt: String(timestamp.toLocaleString()),
    attachmentUrl: `https://${bucketName}.s3.amazonaws.com/${todoId}`
  }

  const result: TodoItem = await todoAccess.createTodo(todoItem)

  return result
}

export const getTodosForUser = async (userId: string): Promise<TodoItem[]> => {
  const result = await todoAccess.getTodosForUser(userId)
  return result
}

export const updateTodo = async (
  todoUpdate: UpdateTodoRequest,
  todoId: string
) => {
  await todoAccess.updateTodo(todoUpdate, todoId)
}

export const deleteTodo = async (todoId: string, userId: string) => {
  await todoAccess.deleteTodo(todoId, userId)
}
