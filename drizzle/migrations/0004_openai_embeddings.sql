-- Switch embedding provider from Cohere to OpenAI text-embedding-3-small.
-- Existing document vectors are in Cohere's vector space and are incompatible
-- with OpenAI query vectors. All documents are cleared so users re-train with
-- the new model. Chatbots are reset to idle so the dashboard shows the correct
-- state and prompts re-training.

TRUNCATE documents;

UPDATE chatbots
SET training_status = 'idle'
WHERE training_status != 'idle';
