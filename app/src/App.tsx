import React, { useContext, useEffect, useState } from "react";
import { Col, Layout, Row, notification, theme } from "antd";
const { Content } = Layout;
import "./App.css";
import { MainPage, ResultPage } from "./pages";
import WelcomeScreen from "./pages/WelcomeScreen/WelcomeScreen";
import { AppTour, TourContext } from "./components";
import { BackendResponse } from "./types";
import { AppVersionProvider } from "./helpers";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { resources } from "../i18n.ts"

type AppProps = {
  setDarkMode: (isDarkMode: boolean) => void;
  setOnChildDataReceive: (fn: (data: BackendResponse) => void) => void;
  setOnChildErrorReceive: (fn: (error: Event) => void) => void;
  ws: WebSocket | null;
};

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    lng: "en",

    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

const App: React.FC<AppProps> = ({
  setDarkMode,
  setOnChildDataReceive,
  setOnChildErrorReceive,
  ws,
}) => {
  const [appStep, setAppStep] = useState(0);
  const [activeTab, setActiveTab] = useState<string>("welcome"); // Set 'welcome' as initial state
  const [showWelcomeScreen, setShowWelcomeScreen] = useState<boolean>(true); // Set 'welcome' as initial state
  // Has tour been completed before?
  // Read tour from cookie
  const { setDoTour } = useContext(TourContext);
  useEffect(() => {
    const cookieTour =
      document.cookie
        .split(";")
        .find((cookie) => cookie.includes("tour"))
        ?.split("=")[1] || "false";
    setDoTour(cookieTour === "false");
  }, [setDoTour]);
  // Does cookie for currentMode exist?
  // Read current mode from cookie
  const cookieCurrentMode =
    document.cookie
      .split(";")
      .find((cookie) => cookie.includes("currentMode"))
      ?.split("=")[1] || "word";
  const [currentMode, setCurrentMode] = useState<string>(cookieCurrentMode); // Set 'word' as initial state
  // Set the cookie
  document.cookie = `currentMode=${currentMode}`;

  // Read dark mode from config
  const { theme: themeToken } = theme.useToken();
  const isDarkMode = themeToken.id === 1;

  const handleToggleDarkMode = () => {
    document.cookie = `darkMode=${!isDarkMode}`;
    setDarkMode(!isDarkMode);
  };

  const [api, contextHolder] = notification.useNotification();
  const handleMenuSelect = (menu: string) => {
    setActiveTab(menu);
    // Delay hiding the WelcomeScreen to allow for animation
    setShowWelcomeScreen(false);
  };

  const handleHoverOverTop = () => {
    setShowWelcomeScreen(true);
  };

  return (
    <AppVersionProvider>
      <div className="hover-target-parent">
        <div className="hover-target" onMouseOver={handleHoverOverTop} />
      </div>
      <Layout className="layout">
        {contextHolder}
        <WelcomeScreen
          className={showWelcomeScreen ? "menu-enter" : "menu-exit"}
          onMenuSelect={handleMenuSelect}
          toggleDarkMode={handleToggleDarkMode}
          isDarkMode={isDarkMode}
          currentMode={currentMode}
          setCurrentMode={setCurrentMode}
          appStep={appStep}
          activeTab={activeTab}
          api={api}
        />
        <Content style={{ padding: "2rem 0" }}>
          <Row>
            <Col span={2} />
            <Col span={20}>
              {activeTab === "app" && ws !== null && (
                <MainPage
                  api={api}
                  setActivePage={handleMenuSelect}
                  currentMode={currentMode}
                  setAppStep={setAppStep}
                  setOnChildDataReceive={setOnChildDataReceive}
                  setOnChildErrorReceive={setOnChildErrorReceive}
                  ws={ws}
                />
              )}
              {activeTab === "about" && <p>About Us content</p>}
              {activeTab === "result" && (
                <ResultPage setActivePage={handleMenuSelect} />
              )}
            </Col>
            <Col span={2} />
          </Row>
        </Content>
      </Layout>
      <AppTour />
    </AppVersionProvider>
  );
};

export default App;
