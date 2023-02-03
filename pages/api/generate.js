import { Configuration, OpenAIApi } from 'openai';

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const generateAction = async (req, res) => {
  console.log(`User input: ${req.body.userInput}`)

  const prompt = 
  `
  I want you to act as an API endpoint for a database. The database contains a list of facts on a specific topic. The application I'm building is a fact guessing game where you're given a question and have to choose the correct answers.

  Give me a JSON response that has 3 correct answers in a specific order and 6 wrong answers. The fields in the response should be "question", "correct_answers" and "wrong_answers". 

  Example question: What are the fastest land animals?
  Example question: What are the most popular games of all time?
  Each question must have answers that are correct in order. 

  Give me a response on the topic of ${req.body.userInput}:
  `
  const baseCompletion = await openai.createCompletion({
    model: 'text-davinci-003',
    prompt: prompt,
    temperature: 0.8,
    max_tokens: 250,
  });
  
  const basePromptOutput = baseCompletion.data.choices.pop();
  res.status(200).json({ output: basePromptOutput });
};

export default generateAction;