import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'

const XAWS = AWSXRay.captureAWS(AWS)

const logger = createLogger('getAllTodos')

// TODO: Implement the dataLayer logic

export class TodoAccess {
  constructor(
    private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
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

    logger.log('Success', {
      result: result
    })

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

    logger.log('Get all todos success', {
      result: result
    })

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

    logger.log('Create todo successfull', {
      data: todo
    })

    return todo
  }

  async updateTodo(todoUpdate: TodoUpdate, todoId: string, userId: string) {
    const params = {
      TableName: this.todosTable,
      IndexName: this.todosTableIndex,
      Key: {
        todoId: todoId,
        userId: userId
      },
      UpdateExpression: 'set #nom = :x, dueDate = :y, done = :z',
      ExpressionAttributeValues: {
        ':x': todoUpdate.name,
        ':y': todoUpdate.dueDate,
        ':z': todoUpdate.done
      },
      ExpressionAttributeNames: {
        '#nom': 'name'
      }
    }
    //name is a reserved keyword in dynamodb so had to use ExpressionAttributeNames

    await this.docClient.update(params).promise()

    logger.log('Update successfull', {
      data: todoUpdate
    })
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

    logger.log('Delete successfull', {
      result: result
    })
  }
}

/*
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
*/
