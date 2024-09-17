import React, { useCallback, useEffect, useState } from "react";
import { Form, Popover, Button, Typography, theme } from "antd";
import "./ImprovedRecipeDisplay.css";
import { BackendUserResultDetails, ImprovedRecipe } from "../../../types";
import { CheckCircleOutlined } from "@ant-design/icons";
import confetti from "canvas-confetti"; // Import the library
import TextArea from "antd/es/input/TextArea";

type ImprovedRecipeDisplayProps = {
  improvedRecipe: ImprovedRecipe;
  sendUserResults: (res: BackendUserResultDetails) => void;
};

interface ClickableSentenceProps {
  sentence: string;
  index: number;
  onAccept: (index: number, sentenceExplanation: string) => void;
  toggleSelection: (index: number) => void;
  showPopover: boolean;
  setShowPopover: (index: number | null) => void;
  getSentenceStyle?: (index: number) => React.CSSProperties;
  wordsIncluded: { word: string; wordIndex: number }[];
  sentenceStyle?: React.CSSProperties;
  sentenceExplanation: string;
  handleExplanationChange: (index: number, newExplanation: string) => void;
}

type BreakElementProps = {};
type ClickableSentenceTempProps = {
  sentence: string;
  index: number;
  toggleSelection: (index: number) => void;
  wordsIncluded: { word: string; wordIndex: number }[];
};

const ClickableSentence: React.FC<ClickableSentenceProps> = React.memo(
  ({
    sentence,
    index,
    onAccept,
    toggleSelection,
    showPopover,
    setShowPopover,
    sentenceExplanation,
    handleExplanationChange,
    sentenceStyle,
  }) => {
    return (
      <Popover
        content={
          <div>
            <TextArea
              placeholder="Write a small explanation, at least 5 characters"
              autoSize={{ minRows: 3, maxRows: 5 }}
              style={{ marginBottom: "5px" }}
              value={sentenceExplanation}
              onChange={(e) => {
                handleExplanationChange(index, e.target.value);
              }}
            />
            <div className="like-dislike-container">
              <Button
                className="like-button"
                onClick={() => onAccept(index, sentenceExplanation)}
              >
                <CheckCircleOutlined />
              </Button>
            </div>
          </div>
        }
        title="Sentence Selection"
        trigger="click"
        visible={showPopover}
        onVisibleChange={(visible) => !visible && setShowPopover(null)}
      >
        <span
          style={{ ...sentenceStyle, marginRight: "5px", cursor: "pointer" }}
          onClick={() => toggleSelection(index)}
        >
          {sentence}{" "}
        </span>
      </Popover>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.sentenceExplanation === nextProps.sentenceExplanation &&
      prevProps.showPopover === nextProps.showPopover &&
      JSON.stringify(prevProps.sentenceStyle) ===
        JSON.stringify(nextProps.sentenceStyle)
    );
  },
);

export const ImprovedRecipeDisplaySentenceScale: React.FC<
  ImprovedRecipeDisplayProps
> = ({ improvedRecipe, sendUserResults }) => {
  const [sentenceExplanations, setSentenceExplanations] = useState<
    Map<number, string>
  >(new Map());
  const [selectedSentences, setSelectedSentences] = useState<
    Map<number, string>
  >(new Map());
  const [showPopover, setShowPopover] = useState<number | null>(null);
  const [allWordsSelected, setAllWordsSelected] = useState<boolean>(false);
  const [elements, setElements] = useState<
    (BreakElementProps | ClickableSentenceProps)[]
  >([]);
  const [wordToSentenceIndex, setWordToSentenceIndex] = useState<
    Map<number, number>
  >(new Map());
  const [totalSentenceCount, setTotalSentenceCount] = useState<
    number | undefined
  >();
  const [sentences, setSentences] = useState<string[]>([]);
  // console.log('WordToSentenceIndex', wordToSentenceIndex)
  // Read dark mode from config
  const { theme: themeToken } = theme.useToken();
  const isDarkMode = themeToken.id === 1;

  const { recipeText, annotations } = improvedRecipe;

  const getSentenceStyle = useCallback(
    (sentenceIndex: number) => {
      const status = selectedSentences.get(sentenceIndex);
      // console.log('Getting style for sentence', sentenceIndex, status)
      if (!isDarkMode) {
        switch (status) {
          case "correct":
            return {
              backgroundColor: "#f0f5ff",
              border: "1px solid #1890ff",
              borderRadius: "4px",
              padding: "2px",
            };
          case "incorrect":
            return {
              backgroundColor: "#ffa39e",
              animation: "fadeBack 1s",
              borderRadius: "4px",
              padding: "2px",
            }; // Light red
          case "accepted":
            return {
              backgroundColor: "#b7eb8f",
              border: "1px solid #52c41a",
              borderRadius: "4px",
              padding: "2px",
            }; // Light green
          case "declined":
            return {
              backgroundColor: "#ffd591",
              border: "1px solid #faad14",
              borderRadius: "4px",
              padding: "2px",
            }; // Light orange
          default:
            return {};
        }
      } else {
        // Dark mode catppucin colors
        switch (status) {
          case "correct":
            return {
              backgroundColor: "#1f2d3d",
              border: "1px solid #1890ff",
              borderRadius: "4px",
              padding: "2px",
            };
          case "incorrect":
            return {
              backgroundColor: "#3b1f1f",
              animation: "fadeBack 1s",
              borderRadius: "4px",
              padding: "2px",
            }; // Light red
          case "accepted":
            return {
              backgroundColor: "#1f3b1f",
              border: "1px solid #52c41a",
              borderRadius: "4px",
              padding: "2px",
            }; // Light green
          case "declined":
            return {
              backgroundColor: "#3b2e1f",
              border: "1px solid #faad14",
              borderRadius: "4px",
              padding: "2px",
            }; // Light orange
          default:
            return {};
        }
      }
    },
    [selectedSentences, isDarkMode],
  );

  useEffect(() => {
    const indices = new Set<number>();
    Object.values(annotations).forEach((tuples) => {
      tuples.forEach(([, index]) => {
        indices.add(index);
      });
    });
    const indicesInAnnotations = Array.from(indices).map((index) =>
      wordToSentenceIndex.get(index),
    );
    const newSelectedMap = new Map(selectedSentences);
    indicesInAnnotations.forEach((randomIndex) => {
      // Set all as 'correct'
      if (randomIndex !== undefined) {
        newSelectedMap.set(randomIndex, "correct");
      }
    });
    setSelectedSentences(newSelectedMap);
  }, [annotations, wordToSentenceIndex]);

  useEffect(() => {
    // Count the current accepted + declined word count
    const acceptedSentences = Array.from(selectedSentences.values()).filter(
      (status) => status === "accepted",
    ).length;
    const declinedSentences = Array.from(selectedSentences.values()).filter(
      (status) => status === "declined",
    ).length;
    const totalWords = acceptedSentences + declinedSentences;
    if (
      totalSentenceCount &&
      totalWords === totalSentenceCount &&
      !allWordsSelected
    ) {
      setAllWordsSelected(true);
      confetti({
        angle: 60,
        spread: 55,
        particleCount: 150,
        origin: { x: 0 }, // start from the left
      });
      confetti({
        angle: 120,
        spread: 55,
        particleCount: 150,
        origin: { x: 1 }, // start from the right
      });
    }
  }, [selectedSentences, totalSentenceCount]);

  const finishReview = () => {
    const res: BackendUserResultDetails = {
      improvedRecipe: recipeText,
      selectedIndexes: Object.fromEntries(selectedSentences),
      providedExplanations: Object.fromEntries(
        sentenceExplanations || new Map(),
      ),
      timestamp: new Date().toISOString(),
      sentences: sentences,
      mode: "sentence",
      variant: "WeHighlightUserExplain",
    };
    // console.log('Sending to trace backend: ', res)
    sendUserResults(res);
  };

  // useCallback to memoize the function
  const handleAccept = useCallback(
    (index: number, sentenceExplanation: string) => {
      // Check whether the explanation is longer than 5 characters
      console.log("Current explanation", sentenceExplanation);
      if (sentenceExplanation.length < 5) {
        return;
      }
      setSelectedSentences((prev) => {
        const newSelected = new Map(prev);
        newSelected.set(index, "accepted");
        return newSelected;
      });
      setShowPopover(null);
    },
    [],
  );

  useEffect(() => {
    console.log("RECALCULATING SENTENCES");
    let sentenceIndex = 0; // Tracks the index of sentences
    const wordIndexToSentenceIndex = new Map<number, number>();
    let totalSentenceCountTemp = 0;
    let wordIndexCounter = 0;
    const sentencesTemp: string[] = [];
    const elementsTemp = recipeText.split("\n").flatMap((line, _) => {
      if (line.trim().length === 0) {
        return {} as BreakElementProps;
      }
      // Grab each sentence from the line
      let lineMatch = line.match(/\(?[^\.\?\!]+[\.!\?]\)?/g);
      if (lineMatch === null) {
        lineMatch = [line];
      }
      const sentenceElements = lineMatch.map((sentence, _) => {
        // Boundary calculation
        // split and Remove words that are just ""
        const wordsInSentence = sentence
          .split(/\s+/)
          .filter((word) => word !== "");
        const currentSentenceIndex = sentenceIndex;
        sentenceIndex += 1;
        // Iterate over the annotations and find the words that are in the sentence
        const wordAnnotations = Object.entries(annotations).filter(
          ([word, _]) => {
            return wordsInSentence.includes(word);
          },
        );
        let wordIndexes: { word: string; wordIndex: number }[];
        if (wordAnnotations !== undefined) {
          wordIndexes = wordAnnotations
            .map(([_, wordAnnotations]) => {
              return wordAnnotations.map(([word, wordIndex]) => ({
                word: word,
                wordIndex: wordIndex,
              }));
            })
            .flat();

          // Map the wordIndexes to the sentenceIndex
          // console.log('Sentence', currentSentenceIndex, 'has words', wordAnnotations, 'between Indexes', wordIndexCounter, 'and', wordIndexCounter + wordsInSentence.length, wordsInSentence)
          wordIndexes.forEach(({ word: _, wordIndex }) => {
            if (
              wordIndex >= wordIndexCounter &&
              wordIndexCounter < wordIndexCounter + wordsInSentence.length
            ) {
              wordIndexToSentenceIndex.set(wordIndex, currentSentenceIndex);
            }
          });

          if (wordIndexes.length > 0) {
            totalSentenceCountTemp += 1;
          }
        } else {
          wordIndexes = [];
        }

        const toggleSentenceSelection = () => {
          if (wordIndexes.length > 0) {
            setSelectedSentences((prev) => {
              const newSelected = new Map(prev);
              newSelected.set(currentSentenceIndex, "correct");
              return newSelected;
            });
            setShowPopover(currentSentenceIndex);
          } else {
            setSelectedSentences((prev) => {
              const newSelected = new Map(prev);
              newSelected.set(currentSentenceIndex, "incorrect");
              return newSelected;
            });
            // Clear incorrect status after animation duration
            setTimeout(() => {
              setSelectedSentences((prev) => {
                const newSelected = new Map(prev);
                newSelected.delete(currentSentenceIndex);
                return newSelected;
              });
            }, 1000);
          }
        };
        sentencesTemp.push(sentence);
        wordIndexCounter += wordsInSentence.length;
        return {
          sentence: sentence,
          index: currentSentenceIndex,
          toggleSelection: toggleSentenceSelection,
          wordsIncluded: wordIndexes,
        } as ClickableSentenceTempProps;
      });

      // Add a line break after each line
      return [
        ...(sentenceElements as ClickableSentenceTempProps[]),
        {} as BreakElementProps,
      ];
    });
    setElements(elementsTemp);
    setWordToSentenceIndex(wordIndexToSentenceIndex);
    setTotalSentenceCount(totalSentenceCountTemp);
    setSentences(sentencesTemp);
  }, [recipeText, annotations]);

  const handleExplanationChange = useCallback(
    (index: number, newExplanation: string) => {
      setSentenceExplanations((prev) => {
        const newExplanations = new Map(prev);
        newExplanations.set(index, newExplanation);
        return newExplanations;
      });
    },
    [setSentenceExplanations],
  );

  // Animation classes added to the elements
  const submitButtonClass = allWordsSelected ? "submit-button-enter" : "";
  const congratsClass = allWordsSelected ? "congrats-text-enter" : "";
  return (
    <Form layout="vertical">
      <Form.Item>
        <div style={{ whiteSpace: "pre-wrap", userSelect: "text" }}>
          {elements.map((element, index) => {
            if ("sentence" in element) {
              return (
                <ClickableSentence
                  key={`sentence-${index}`}
                  {...element}
                  showPopover={showPopover === element.index}
                  sentenceStyle={getSentenceStyle(element.index)}
                  setShowPopover={setShowPopover}
                  sentenceExplanation={
                    sentenceExplanations.get(element.index) || ""
                  }
                  handleExplanationChange={handleExplanationChange}
                  onAccept={handleAccept}
                />
              );
            } else {
              return <br key={`br-${index}`} />;
            }
          })}
        </div>
      </Form.Item>
      {allWordsSelected && (
        <Form.Item>
          <Typography.Text strong className={congratsClass}>
            Congratulations! You found all words!
          </Typography.Text>
          <Button
            type="primary"
            className={submitButtonClass}
            onClick={finishReview}
          >
            Submit your results!
          </Button>
        </Form.Item>
      )}
    </Form>
  );
};

export default ImprovedRecipeDisplaySentenceScale;
