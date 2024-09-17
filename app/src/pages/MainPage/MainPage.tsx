import { Card, Col, Empty, Popover, Row, Space, Typography } from "antd"
import { Guider, IPageRef, UserHighlightWeExplain, UserHighlightWeExplain_word, RecipeForm, TourContext, UserHighlightUserExplain, UserHighlightUserExplain_word } from "../../components"
import { useContext, useEffect, useRef, useState } from "react";
import { BackendInput, ImprovedRecipe, BackendResponse, BackendUserResult, BackendUserResultDetails } from "../../types";
import { NotificationInstance } from "antd/es/notification/interface";
import { BulbOutlined, QuestionOutlined } from "@ant-design/icons";
import { WeHighlightUserExplain, WeHighlightUserExplain_word } from "../../components/ImprovedRecipe/WeHighlightUserExplain";
import { WeHighlightWeExplain, WeHighlightWeExplain_word } from "../../components/ImprovedRecipe/WeHighlightWeExplain";


type MainPageProps = {
    api: NotificationInstance
    setActivePage: (page: string) => void;
    currentMode: string;
    setAppStep: React.Dispatch<React.SetStateAction<number>>;
    ws: WebSocket;
    setOnChildDataReceive: (fn: (data: BackendResponse) => void) => void;
    setOnChildErrorReceive: (fn: (error: Event) => void) => void;
}
const backendUrlHttp = 'https://gelex-backend-a3bfadfb8f41.herokuapp.com'

export const MainPage: React.FC<MainPageProps> = ({api, setActivePage, currentMode, setAppStep, setOnChildDataReceive, setOnChildErrorReceive, ws}) => {
    const { doTour, setCurrentPage, startTour, setDoTour } = useContext(TourContext);

    const [currentStep, setStep] = useState(0);

    useEffect(() => {
        setAppStep(currentStep);
    }, [currentStep, setAppStep]);

    const [originalRecipe, setOriginalRecipe] = useState<string>('');
    const [improvementLevel, setImprovementLevel] = useState<number>(0);
    const [revealExtraWord, setRevealExtraWord] = useState<() => void>(() => () => {});
    const [revealAllWords, setRevealAllWords] = useState<() => void>(() => () => {});
    // Does the cookie savedImprovedRecipe exist? (for debugging)
    const savedImprovedRecipe = document.cookie.split(';').find((cookie) => cookie.includes('savedImprovedRecipe'))?.split('=')[1];
    // If it exists parse the JSON
    const parsedImprovedRecipe = savedImprovedRecipe ? JSON.parse(savedImprovedRecipe) as ImprovedRecipe : undefined;
    const [improvedRecipe, setImprovedRecipe] = useState<ImprovedRecipe|undefined>();
    const [improvedRecipeLoading, setimprovedRecipeLoading] = useState(false);
    // we will be displaying a different version of the app depending on the userId
    // So we get the userId, hash it then do modulo4 to get the version
    // Versions are as follows:
    // 0: User highlight & User explain
    // 1: User highlight & AI explain
    // 2: AI highlight & User explain
    // 3: AI highlight & AI explain
    const appVersion = parseInt(document.cookie.split(';').find((cookie) => cookie.includes('userId'))?.split('=')[1] || '0', 10) % 4;

    // Ref Map
    const refMap: Record<string, React.RefObject<HTMLDivElement>> = {};
    refMap['improved-recipe-wrapper'] = useRef<HTMLDivElement>(null);
    refMap['reveal-next-change'] = useRef<HTMLDivElement>(null);
    refMap['reveal-all-changes'] = useRef<HTMLDivElement>(null);
    
    const [refState, _] = useState<IPageRef[]>([
        {
            title: 'Your improved recipe will be here!',
            content: appVersion < 2 ? `You will be asked to find out the changes either in word-scale or sentence-scale(Remember you can always the scale from the menu!)` : 'The changes will already be highlighted for you!',
            target: refMap['improved-recipe-wrapper'],
            onClose: () => {
                setCurrentPage(4);
            }
        },
        ...( appVersion < 2 ? [
        {
            title: 'Reveal the changes!',
            content: 'Click here to reveal one of the changes!',
            target: refMap['reveal-next-change'],
            onClose: () => {
                setCurrentPage(4);
            }
        },
        {
            title: 'Reveal the changes!',
            content: 'Click here to reveal all of the changes!',
            target: refMap['reveal-all-changes'],
            onClose: () => {
                setCurrentPage(4);
            }
        }
    ] : [])
    ]);


    useEffect(() => {
        // Define the function that the parent will call
        const handleData = (data: BackendResponse) => {
            setImprovementLevel(improvementLevel);
            setImprovedRecipe({
                recipeText: data.example_recipe,
                annotations: data.annotations,
            });
            // Save the improved recipe to cookie (for debugging)
            document.cookie = `savedImprovedRecipe=${JSON.stringify({
                recipeText: data.example_recipe,
                annotations: data.annotations,
            })}`;
            setimprovedRecipeLoading(false);
            setStep(2);
            api.success({
                message: 'Your new recipe is here!',
                description: 'Can you identify the changes? Click on the words you think are new!',
                placement: 'top',
            });
        };

        const handleError = (error: Event) => {
            console.error("WebSocket error:", error);
            setimprovedRecipeLoading(false);
            if(!doTour){
                console.log("Websocket error while not in tour");
                setOriginalRecipe('');
                setImprovedRecipe(undefined);
                setStep(0);
            }
            else{
                console.log("Websocket error while in tour");
            }
        }

        // Pass this function to the parent
        setOnChildDataReceive(handleData);
        setOnChildErrorReceive(handleError);

        return () => {
            setOnChildDataReceive(() => {});
            setOnChildErrorReceive(() => {});
        };
    }, [setOnChildDataReceive, setOnChildErrorReceive, doTour]);

    const submitHit = async (recipe: string, improvementLevel: number, fromTour?: boolean) => {
        // console.log('Submitting recipe mainpage: ', recipe, fromTour)
        if(doTour && fromTour){
            setImprovedRecipe({
                recipeText: 'This is an example improved recipe. Click on the words you think are new!',
                annotations: {
                    'This': [['th', 0]],
                    'an': [['an', 2]],
                    'words': [['word', 9]],
                },
            })
            setCurrentPage(3)
            setTimeout(()=>startTour(refState),1);
            setStep(2);
            return;
        }
        // Check the length of the recipe
        if (recipe.length < 25) {
            api.error({
                message: 'Error',
                description: 'Please enter a longer recipe.',
                placement: 'top',
            });
            return;
        }
        const rule_counts = [1,3,5,10,30];
        // console.log(`Submitting hit with recipe: ${recipe} and improvementLevel: ${improvementLevel}, num_rules: ${rule_counts[improvementLevel]}`)
        setimprovedRecipeLoading(true);
        setStep(1);

        // Read userId from cookie
        const userId = document.cookie.split(';').find((cookie) => cookie.includes('userId'))?.split('=')[1];    
        if (ws && ws.readyState === WebSocket.OPEN) {
            // Prepare the data to send
            const dataToSend = JSON.stringify({
                user_recipe: recipe,
                number_of_rules: rule_counts[improvementLevel],
                user_id: userId,
            } as BackendInput);

            // Send data through WebSocket
            ws.send(dataToSend);
            setOriginalRecipe(recipe);
        }
        else{
            console.error("WebSocket is not connected.");
            api.error({
                message: 'Error',
                description: 'Connection to the server failed. Please try again.',
                placement: 'top',
            });
            setOriginalRecipe('');
            setImprovedRecipe(undefined);
            setStep(0);
            setimprovedRecipeLoading(false);
        }
    };

    const finishReview = (results:BackendUserResultDetails) => {
        if(doTour){
            setActivePage('result');
            setDoTour(false);
            // Set cookieTour to true
            document.cookie = "tour=true;max-age=31536000";
            return;
        }
        // Extend the results with the original recipe and improvement level
        results.originalRecipe = originalRecipe;
        results.improvementLevel = improvementLevel;
        const userId = document.cookie.split(';').find((cookie) => cookie.includes('userId'))?.split('=')[1];
        if (!userId) { 
            api.error({
                message: 'Error',
                description: 'Something went wrong. Please try again.',
                placement: 'top',
            });
            return;
        }
        const resultsForBackend: BackendUserResult = {
            user: userId,
            event: 'finishReview',
            details: results,
        }
        // console.log('Submitting results', resultsForBackend);
        // Hit endpoint with results(/trace/)
        fetch(`${backendUrlHttp}/trace`, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(resultsForBackend)
        }).then(response => response.json().then((data) => {
            console.log('Trace Data:', data);
            // Go to results page.
            setActivePage('result');
        })).catch(error => {
            console.log(error);
            api.error({
                duration: 0,
                message: 'Error',
                description: 'Something went wrong. Please try again.',
                placement: 'top',
            });
        }
        );
    }

    return(
        <Space direction="vertical" size="large" style={{ display: 'flex' }}>
        <Row>
            <Guider currentStep={currentStep}/>
        </Row>
        <Row gutter={32} style={{height: '100%'}}>
            <Col span={12} style={{height: '100%'}}>
                <RecipeForm submitHit={submitHit} currentStep={currentStep} api={api}/>
            </Col>
            <Col span={12}>
                {  // App version 0 & 1 has the user highlighting the changes, thus we require the reveal buttons
                appVersion < 2 && (
                <Card 
                title="Improved Recipe" 
                loading={improvedRecipeLoading}
                ref={refMap['improved-recipe-wrapper']}
                actions={[
                    <Popover
                        content={"Reveal one extra " + (currentMode === 'sentence' ? 'sentence' : 'word') + "!"}
                    >
                        <QuestionOutlined onClick={revealExtraWord} ref={refMap['reveal-next-change']}/>
                    </Popover>,
                    <Popover
                        content={"Reveal all " + (currentMode === 'sentence' ? 'sentences' : 'words') + "!"}
                    >
                        <BulbOutlined onClick={revealAllWords} ref={refMap['reveal-all-changes']}/>
                    </Popover>,
                ]}>
                    { appVersion === 1 && improvedRecipe && currentMode === 'sentence' && (
                    <UserHighlightWeExplain 
                        improvedRecipe={improvedRecipe}
                        sendUserResults={finishReview}
                        setRevealExtraWord={setRevealExtraWord}
                        setRevealAllWords={setRevealAllWords}
                    />)}
                    {appVersion === 1 && improvedRecipe && currentMode === 'word' && (
                    <UserHighlightWeExplain_word 
                        improvedRecipe={improvedRecipe}
                        sendUserResults={finishReview}
                        setRevealExtraWord={setRevealExtraWord}
                        setRevealAllWords={setRevealAllWords}
                    />)}
                    {appVersion === 0 && improvedRecipe && currentMode === 'sentence' && (
                        <UserHighlightUserExplain 
                            improvedRecipe={improvedRecipe}
                            sendUserResults={finishReview}
                            setRevealExtraWord={setRevealExtraWord}
                            setRevealAllWords={setRevealAllWords}
                        />
                    )}
                    {appVersion === 0 && improvedRecipe && currentMode === 'word' && (
                        <UserHighlightUserExplain_word
                            improvedRecipe={improvedRecipe}
                            sendUserResults={finishReview}
                            setRevealExtraWord={setRevealExtraWord}
                            setRevealAllWords={setRevealAllWords}
                        />
                    )}
                    {!improvedRecipe && (<Empty
                    description='No recipe yet!'
                    />)}                
                </Card>
            )}
            { appVersion >= 2 && (
                <Card 
                title="Improved Recipe" 
                loading={improvedRecipeLoading}
                ref={refMap['improved-recipe-wrapper']}>
                    { appVersion === 2 && improvedRecipe && currentMode === 'sentence' && (
                    <WeHighlightUserExplain 
                        improvedRecipe={improvedRecipe}
                        sendUserResults={finishReview}
                    />)}
                    {appVersion === 2 && improvedRecipe && currentMode === 'word' && (
                    <WeHighlightUserExplain_word 
                        improvedRecipe={improvedRecipe}
                        sendUserResults={finishReview}
                    />)}
                    {appVersion === 3 && improvedRecipe && currentMode === 'sentence' && (
                        <WeHighlightWeExplain
                            improvedRecipe={improvedRecipe}
                            sendUserResults={finishReview}
                        />
                    )}
                    {appVersion === 3 && improvedRecipe && currentMode === 'word' && (
                        <WeHighlightWeExplain_word
                            improvedRecipe={improvedRecipe}
                            sendUserResults={finishReview}
                        />
                    )}
                    {!improvedRecipe && (<Empty
                    description='No recipe yet!'
                    />)}                
                </Card>
            )}
            </Col>
        </Row>
    </Space>
)}