import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
//import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'

const XAWS = AWSXRay.captureAWS(AWS)

//const logger = createLogger('TodosAccess')

// TODO: Implement the dataLayer logic

export class TodoAccess {
  constructor(
    private readonly docClient: DocumentClient = createDynamoDBClient(),
    private readonly todosTable = process.env.TODOS_TABLE,
    private readonly todosTableIndex = process.env.TODOS_CREATED_AT_INDEX
  ) {}

  async getAllTodos(): Promise<TodoItem[]> {
    console.log('Getting all groups')

    const result = await this.docClient
      .scan({
        TableName: this.todosTable
      })
      .promise()

    const items = result.Items
    return items as TodoItem[]
  }

  async getTodosForUser(userId: string): Promise<TodoItem[]> {
    const result = await this.docClient
      .query({
        TableName: this.todosTable,
        IndexName: this.todosTableIndex,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      })
      .promise()

    const items = result.Items
    return items as TodoItem[]
  }

  async createTodo(todo: TodoItem): Promise<TodoItem> {
    await this.docClient
      .put({
        TableName: this.todosTable,
        Item: todo
      })
      .promise()

    return todo
  }

  async updateTodo(todoUpdate: TodoUpdate, todoId: string) {
    const params = {
      TableName: this.todosTable,
      IndexName: this.todosTableIndex,
      Key: {
        todoId: todoId
      },
      UpdateExpression: 'set name = :x, dueDate = :y, done = :z',
      ExpressionAttributeValues: {
        ':x': todoUpdate.name,
        ':y': todoUpdate.dueDate,
        ':z': todoUpdate.done
      }
    }

    await this.docClient.update(params).promise()
  }

  async deleteTodo(todoId: string, userId: string) {
    const params = {
      TableName: this.todosTable,
      Key: {
        todoId: todoId,
        userId: userId
      }
    }
    const result = await this.docClient.delete(params).promise()

    console.log(result)
  }
}

const createDynamoDBClient = () => {
  if (process.env.IS_OFFLINE) {
    console.log('Creating a local DynamoDB instance')
    return new XAWS.DynamoDB.DocumentClient({
      region: 'localhost',
      endpoint: 'http://localhost:8000'
    })
  }

  return new XAWS.DynamoDB.DocumentClient()
}
