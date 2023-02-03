import { useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import buildspaceLogo from '../assets/buildspace-logo.png';
import { useState } from 'react';
import { validateInput } from '../utils/validator';

// Dummy options for testing - 9 random words
const dummyOptions = [
  'apple',
  'banana',
  'carrot',
  'dog',
  'elephant',
  'fish',
  'giraffe',
  'horse',
  'ice cream',
];

// How this game works:
// 1. User types in a prompt and clicks generate
// 2. OpenAI generates a question and a list of 9 words, including 3 answers
// 3. User selects 3 answers to fill in the blanks
// 4. User clicks submit
// 5. If the selections are in the answers array in the correct order, then the user wins
// 6. If the selections are in the answers array but in the wrong order, mark the answer blocks yellow
// 7. If the selections are not in the answers array, ignore the selections 

const Home = () => {
  const [userInput, setUserInput] = useState('');
  const [apiOutput, setApiOutput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [options, setOptions] = useState();
  const [selections, setSelections] = useState(Array(9).fill('?'));
  const [question, setQuestion] = useState('');
  const [answers, setAnswers] = useState(["fish", "dog", "horse"]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentRow, setCurrentRow] = useState(0);
  const [enabledAnswers, setEnabledAnswers] = useState([]);

  // Set test options
  // useEffect(() => {
  //   setOptions(dummyOptions);
  // }, []);

  const callGenerateEndpoint = async () => {

    if (!validateInput(userInput)) {
      window.alert("No funny business 🤡")
      return;
    }
    
    setIsGenerating(true);

    console.log('Calling OpenAI...');
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userInput }),
    });

    const data = await response.json();
    const { output } = data;
    console.log('OpenAI replied...', output.text);

    // {
    //   "question": "What are the most popular programming languages?",
    //   "correct_answers": ["JavaScript", "Python", "Java"],
    //   "wrong_answers": ["C++", "Go", "Ruby", "C#", "PHP", "Objective-C"]
    // }

    // Parse the output text as JSON
    const outputJSON = JSON.parse(output.text);
    // Set options as randomised combined correct and wrong answers
    setOptions([...outputJSON.correct_answers, ...outputJSON.wrong_answers].sort(() => Math.random() - 0.5));
    setQuestion(outputJSON.question);
    setAnswers(outputJSON.correct_answers);

    setIsGenerating(false);
  };

  const onUserChangedText = (event) => {
    setUserInput(event.target.value);
  };

  const handleAnswerSelection = (answer) => {
    const updatedSelections = [...selections];
    updatedSelections[currentIndex] = answer;
    setSelections(updatedSelections);
    setCurrentIndex(currentIndex + 1);
  };

  const handleUndo = () => {
    // If currentRow is 1 or 2, do not allow undo beyond 3/6
    if (currentRow === 1 && currentIndex === 3) {
      return;
    }
    else if (currentRow === 2 && currentIndex === 6) {
      return;
    }

    const updatedSelections = [...selections];
    updatedSelections[currentIndex - 1] = "?";
    setSelections(updatedSelections);
  
    if (currentIndex !== 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const renderSelections = () => {
    return selections.map((selection, index) => {
      return (
        <div key={index} className="square">
          <p>{selection}</p>
        </div>
      );
    }
  )}

  const green = "#538d4e";
  const yellow = "#b59f3b";

  const handleEnter = () => {
    // If the current index is divisible by 3, then we are at the end of a row
    if (currentIndex % 3 === 0) {
      const row = selections.slice(currentIndex - 3, currentIndex);
      
      // Check if the current row is a winning row
      if (row.toString() === answers.toString()) {
        console.log("You win!");
        window.alert("You win!")
      }

      for (let i = 0; i < row.length; i++) {
        // If the row value is in the answers array, check if it is in the right spot
        if (answers.includes(row[i])) {
          if (row[i] === answers[i]) {
            document.getElementById(row[i]).style.backgroundColor = green;
          }
          else {
            document.getElementById(row[i]).style.backgroundColor = yellow;
          }
          // Enable the button
          setEnabledAnswers([...enabledAnswers, row[i]]);

          // document.getElementById(row[i]).disabled = false;
        }
      }
      
      // Move to the next row
      setCurrentRow(currentRow + 1);
    }
    console.log("Current row: ", currentRow);
  }

    return (
    <div className="root">
      <Head>
        <title>Factle generator | buildspace</title>
      </Head>
      <div className="container">
        <div className="header">
          <div className="header-title">
            <h1>AI Factle Generator</h1>
          </div>
          <div className="header-subtitle">
            <h2>What do you want your game to be about?</h2>
          </div>
        </div>

        <div className="prompt-container">
          <input
            type="text"
            placeholder="start typing here"
            className="prompt-box"
            value={userInput}
            onChange={onUserChangedText}
          />

          <div className="prompt-buttons">
            <a
              className={
                isGenerating ? 'generate-button loading' : 'generate-button'
              }
              onClick={callGenerateEndpoint}
            >
              <div className="generate">
                {isGenerating ? (
                  <span className="loader"></span>
                ) : (
                  <p>Generate</p>
                )}
              </div>
            </a>
          </div>
          
          <div className="question">
            {/* if question, show h3 */}
            {
              question && <h3>{question}</h3>
            }
          </div>

          {/* {apiOutput && (
            <div className="output">
              <div className="output-header-container">
                <div className="output-header">
                  <h3>Output</h3>
                </div>
              </div>
              <div className="output-content">
                <p>{apiOutput}</p>
              </div>
            </div>
          )} */}
        </div>

        {/* 3x3 grid of squares that will contain selections, map through selections*/}
        <div className="selection-grid">
          {renderSelections()}
        </div>
        
        {options && (

          <div className="answer-grid">
            {options.map((answer, index) => (
              <button
                key={index}
                id={answer}
                onClick={() => handleAnswerSelection(answer)}
                className={`answer-button ${
                  selections.includes(answer) && !enabledAnswers.includes(answer) ? 'answer-selected' : ''
                }`}
                // Disable button if not in enabledAnswers array AND in selections array
                disabled = {selections.includes(answer) && !enabledAnswers.includes(answer)}
              >
                {answer}
              </button>
            ))}
          </div>
        )}

        <div className="controls">
          {/* Two buttons, one that says Undo, another that says Enter*/}
          <button className="undo-button" onClick={handleUndo}>
            Undo
          </button>
          <button className="enter-button" onClick={handleEnter}>Enter</button>
        </div>
      </div>
      <div className="badge-container grow">
        <a
          href="https://buildspace.so/builds/ai-writer"
          target="_blank"
          rel="noreferrer"
        >
          <div className="badge">
            <Image src={buildspaceLogo} alt="buildspace logo" />
            <p>build with buildspace</p>
          </div>
        </a>
      </div>
    </div>
  );
};

export default Home;
