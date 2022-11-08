import AWS from 'aws-sdk';
import createError from 'http-errors';
import { getAuctionById } from './getAuction';

import commonMiddleware from '../lib/commonMiddleware';

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function placeBid(event, context) {
  const { id } = event.pathParameters;
  const { amount } = event.body;

  const auction = await getAuctionById(id);

  if (amount <= auction.highesBid.amount) {
    throw new createError.Forbidden(
      `your bid must be higher than ${auction.highesBid.amount}!`
    );
  }

  const params = {
    TableName: process.env.AUCTIONS_TABLE_NAME,
    key: { id },
    UpdateExpression: 'set highestBid.amount= :amount',
    ExpressionAttributeValues: {
      ':amount': amount,
    },
    ReturnValues: 'ALL_NEW',
  };

  let updatedAuction;

  try {
    const result = await dynamodb.update(params).promise();
    updatedAuction = result.Attributes;
  } catch (error) {
    console.log(error);
    throw new createError.InternalServerError(error);
  }

  return {
    statusCode: 200,
    body: JSON.stringify(updatedAuction),
    headers: {
      'Content-Type': 'application/json',
    },
  };
}

export const handler = commonMiddleware(placeBid);
