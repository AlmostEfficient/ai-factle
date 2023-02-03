import { useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import buildspaceLogo from '../assets/buildspace-logo.png';
import { useState } from 'react';

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
  const [selections, setSelections] = useState(Array(9).fill({value: '?', color: ''}));
  const [question, setQuestion] = useState('');
  const [answers, setAnswers] = useState(["fish", "dog", "horse"]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentRow, setCurrentRow] = useState(0);

  // const initialSelections = [];
  // for (let i = 0; i < 9; i++) {
  //   initialSelections.push({ value: '?', color: 'none' });
  // }
  // setSelections(initialSelections);
  
  // Set test options
  useEffect(() => {
    setOptions(dummyOptions);
  }, []);
  const callGenerateEndpoint = async () => {
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

    setApiOutput(`${output.text}`);
    setIsGenerating(false);
  };

  const onUserChangedText = (event) => {
    setUserInput(event.target.value);
  };

  const handleAnswerSelection = (answer) => {
    const updatedSelections = [...selections];
    updatedSelections[currentIndex] = { value: answer, color: '' };
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
  updatedSelections[currentIndex - 1] = { value: '?', color: '' };
  setSelections(updatedSelections);
    
    if (currentIndex !== 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const renderSelections = () => {
    return selections.map((selection, index) => {
      return (
        <div key={index} className={`square ${selection.color}`}>
          <p>{selection.value}</p>
        </div>
      );
    });
  };

  const handleEnter = () => {
    // If the current index is divisible by 3, then we are at the end of a row
    if (currentIndex % 3 === 0) {
      // Check if the current row is a winning row
      const row = selections.slice(currentIndex - 3, currentIndex);
      console.log("Current row: ", row);
      console.log("Answers: ", answers);
      const rowValues = row.map((selection) => selection.value);
      if (rowValues.toString() === answers.toString()) {
        console.log("You win!");
        window.alert("You win!")

        // Set the color of the answer blocks to green
        const updatedSelections = [...selections];
        updatedSelections[currentIndex - 3] = { value: row[0], color: 'green' };
        updatedSelections[currentIndex - 2] = { value: row[1], color: 'green' };
        updatedSelections[currentIndex - 1] = { value: row[2], color: 'green' };
        setSelections(updatedSelections);
      }
      else if (answers.includes(rowValues[0]) || answers.includes(rowValues[1]) || answers.includes(rowValues[2])) {
        // If row values are in the answers array but in the wrong order, mark the answer blocks yellow
        console.log("Wrong order");
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
              {question && <h3>{question}</h3>}
            </div>

            {apiOutput && (
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
            )}
          </div>

          {/* 3x3 grid of squares that will contain selections, map through selections*/}
          <div className="selection-grid">{renderSelections()}</div>

          {options && (
            <div className="answer-grid">
              {options.map((answer, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelection(answer)}
                  className={`answer-button ${
                    selections.some((item) => item.value === answer)
                      ? 'answer-selected'
                      : ''
                  }`}
                  disabled={selections.some((item) => item.value === answer)}
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
            <button className="enter-button" onClick={handleEnter}>
              Enter
            </button>
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
