import DynamoDB from 'aws-sdk/clients/dynamodb';

export const DBLocal: DynamoDB = new DynamoDB({
    region: 'ap-southeast-1',
    endpoint: 'http://localhost:8000',
});

export const makeGlobalDatabase = async () => {
    const params: DynamoDB.CreateTableInput = {
        TableName: 'MainTable',
        AttributeDefinitions: [
            {
                AttributeName: 'pk',
                AttributeType: 'S',
            },
            {
                AttributeName: 'gsi1pk',
                AttributeType: 'S',
            },
            {
                AttributeName: 'gsi1sk',
                AttributeType: 'S',
            },
        ],
        KeySchema: [
            {
                AttributeName: 'pk',
                KeyType: 'HASH',
            },
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: 'gsi1',
                KeySchema: [
                    {
                        AttributeName: 'gsi1pk',
                        KeyType: 'HASH',
                    },
                    {
                        AttributeName: 'gsi1sk',
                        KeyType: 'RANGE',
                    },
                ],
                Projection: {
                    ProjectionType: 'ALL',
                },
            },
        ],
        BillingMode: 'PAY_PER_REQUEST',
    };
    await DBLocal.createTable(params).promise();
    return DBLocal;
};

export const deleteGlobalDatabase = async () => {
    const params: DynamoDB.DeleteTableInput = {
        TableName: 'MainTable',
    };
    await DBLocal.deleteTable(params).promise();
};
