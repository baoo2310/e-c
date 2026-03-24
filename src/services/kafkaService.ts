import { Partitioners } from "kafkajs";
import { kafka } from "../config/kafka";

const producers = kafka.producer({ createPartitioner: Partitioners.DefaultPartitioner })
export const connectProducer = async () => {
    try {
        await producers.connect();
        console.log('Kafka Producer connected successfully');
    } catch (error) {
        console.error('Error connecting Kafka Producer:', error);
    }
};

export const disconnectProducer = async () => {
    await producers.disconnect();
};

export const publishEvent = async (topic: string, eventType: string, payload: any) => {
    try {
        await producers.send({
            topic,
            messages: [
                {
                    key: eventType,
                    value: JSON.stringify(payload)
                },
            ],
        });
        console.log(`Event [${eventType}] published to topic [${topic}]`);
    } catch (error) {
        console.error(`Failed to publish event [${eventType}]:`, error);
    }
}