import { IRecordMastRepository } from 'stage3-abr';
import { RecordMast } from 'stage3-abr/dist/entities/type';
import { DynamoDBRepositoryBase } from '../dynamoDBRepositoryBase';

export class DynamoDBRecordMastRepository extends DynamoDBRepositoryBase<RecordMast> implements IRecordMastRepository {
    public addRecord(input: RecordMast): Promise<RecordMast> {
        return this.putItem({
            TableName: this.tableName,
            Item: {
                PK: this.getPK(input),
                SK: this.getSK(input),
                uuid: this.getUUID(input),
                CleaningRoomID: this.getCleaningRoomID(input),
                CleanerID: this.getCleanerID(input),
                ...input,
            },
            ConditionExpression: 'attribute_not_exists(#PK) AND attribute_not_exists(#SK)',
            ExpressionAttributeNames: {
                '#PK': 'PK',
                '#SK': 'SK',
            },
        });
    }

    public updateRecord(input: RecordMast): Promise<RecordMast> {
        return this.putItem({
            TableName: this.tableName,
            Item: {
                PK: this.getPK(input),
                SK: this.getSK(input),
                uuid: this.getUUID(input),
                CleaningRoomID: this.getCleaningRoomID(input),
                CleanerID: this.getCleanerID(input),
                ...input,
            },
            ConditionExpression: 'attribute_exists(#PK) AND attribute_exists(#SK)',
            ExpressionAttributeNames: {
                '#PK': 'PK',
                '#SK': 'SK',
            },
        });
    }

    public fetchAllRecordsByHotelID(recordHotelID: string): Promise<RecordMast[]> {
        return this.query({
            TableName: this.tableName,
            KeyConditionExpression: '#PK = :PK and begins_with(#SK, :SK)',
            ExpressionAttributeNames: {
                '#PK': 'PK',
                '#SK': 'SK',
            },
            ExpressionAttributeValues: {
                ':PK': `Record`,
                ':SK': recordHotelID
            },
        });
    }

    public fetchRecordsByCleanerID(cleanerID: string): Promise<RecordMast[]> {
        return this.query({
            TableName: this.tableName,
            IndexName: 'CleanerID-index',
            KeyConditionExpression: '#CleanerID = :CleanerID',
            ExpressionAttributeNames: {
                '#CleanerID': 'CleanerID' // GSIの作成時に指定したキー名を設定
            },
            ExpressionAttributeValues: {
                ':CleanerID': cleanerID
            },
        });
    }

    public fetchRecordsByRoomID(cleaningRoomID: string): Promise<RecordMast[]> {
        return this.query({
            TableName: this.tableName,
            IndexName: 'CleaningRoomID-index',
            KeyConditionExpression: '#CleaningRoomID = :CleaningRoomID',
            ExpressionAttributeNames : {
                '#CleaningRoomID' : 'CleaningRoomID' // GSIの作成時に指定したキー名を設定
            },
            ExpressionAttributeValues: {
                ':CleaningRoomID': cleaningRoomID
            },
        });
    }

    public async fetchRecordByRecordID(recordID: string): Promise<RecordMast | null> {
        const res = await this.query({
            TableName: this.tableName,
            IndexName: DynamoDBRepositoryBase.UUIDIndexName,
            KeyConditionExpression: '#uuid = :uuid',
            ExpressionAttributeNames: {
                '#uuid': 'uuid',
            },
            ExpressionAttributeValues: {
                ':uuid': recordID,
            },
        });
        if (res.length) {
            return res[0]
        } else {
            return null
        }
    }

    // ================================================
    // keys
    // ================================================
    protected getPK(input: RecordMast):string {
        return `Record`;
    }
    protected getSK(input: RecordMast):string {
        return `${input.recordHotelID}#${input.createdAt}`;
    }
    protected getUUID(input: RecordMast):string {
        return `${input.recordID}`;
    }
    protected getCleaningRoomID(input: RecordMast):string {
        return `${input.cleaningRoomID}`
    }
    protected getCleanerID(input: RecordMast):string {
        return `${input.cleanerID}`
    }
}