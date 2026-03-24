import { Kafka } from "kafkajs";
import { ENV } from "./env";

export const USER_EVENTS_TOPIC = 'user-events';

export const kafka = new Kafka({
    clientId: ENV.KAFKA_CLIENT_ID,
    brokers: [ENV.KAFKA_BROCKERS],
    // Retry mechanism is crucial for resilient microservices
    retry: {
        initialRetryTime: 100,
        retries: 8
    }
})

const admin = kafka.admin();
let isUserEventsTopicEnsured = false;

export const ensureUserEventsTopic = async () => {
    if (isUserEventsTopicEnsured) return;

    try {
        await admin.connect();
        const existingTopics = await admin.listTopics();

        if (!existingTopics.includes(USER_EVENTS_TOPIC)) {
            await admin.createTopics({
                waitForLeaders: true,
                topics: [{ topic: USER_EVENTS_TOPIC, numPartitions: 1, replicationFactor: 1 }],
            });
        }

        isUserEventsTopicEnsured = true;
    } finally {
        await admin.disconnect();
    }
};

const consumer = kafka.consumer({ groupId: 'email-service-group' });

export const connectConsumer = async () => {
    try {
        await ensureUserEventsTopic();
        await consumer.connect();
        console.log('Kafka Consumer connected successfully');

        // Subscribe to the exact topic our Producer is writing to
        await consumer.subscribe({ topic: USER_EVENTS_TOPIC, fromBeginning: true });

        // Start listening for messages in the background
        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                const eventType = message.key?.toString();
                const payload = JSON.parse(message.value?.toString() || '{}');

                console.log(`\n--- NEW KAFKA MESSAGE RECEIVED ---`);
                console.log(`Topic: ${topic}`);
                console.log(`Event: ${eventType}`);
                console.log(`Data:`, payload);

                // This is where you trigger the background business logic
                if (eventType === 'USER-REGISTERED') {
                    console.log(`Action: Pretending to send Welcome Email to ${payload.email}...`);
                }
                console.log(`--------------------------------------\n`);
            },
        });
    } catch (error) {
        console.error('Error connecting Kafka Consumer:', error);
    }
}