import React, { useContext, useEffect, useMemo, useRef } from "react";
import { List, Button, Typography, Modal, Input } from "antd";
import {
  ArrowUpOutlined,
  CoffeeOutlined,
  EditOutlined,
  GlobalOutlined,
  InfoCircleOutlined,
  PoweroffOutlined,
  QuestionCircleOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import "./WelcomeScreen.css";
import { IPageRef, TourContext } from "../../components";
import { NotificationInstance } from "antd/es/notification/interface";
import { useAppVersionContext } from "../../helpers";
import { useTranslation } from "react-i18next";

type WelcomeScreenProps = {
  onMenuSelect: (menu: string) => void;
  toggleDarkMode: () => void;
  className?: string;
  isDarkMode: boolean;
  currentMode: string;
  setCurrentMode?: (mode: string) => void;
  activeTab: string;
  api: NotificationInstance;
  appStep: number;
};


// create a dictionary with app passwords
const passwordDefinitions = {
  appv1xhyu: 0,
  appv2bpog: 1,
  appv3hiec: 2,
  appv4oume: 3,
};

const { Text } = Typography;

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onMenuSelect,
  toggleDarkMode,
  className,
  isDarkMode,
  currentMode,
  setCurrentMode,
  activeTab,
  api,
  appStep,
}) => {
  const switchText = currentMode === "word" ? "sentence" : "word";
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [modalText, setModalText] = React.useState("");
  const { t, i18n } = useTranslation();
  const showModal = () => {
    setIsModalOpen(true);
  };
  const { changeAppVersion } = useAppVersionContext();
  const handleOk = () => {
    if (modalText in passwordDefinitions) {
      console.log(
        //@ts-ignore
        `Switching to appVersion=${passwordDefinitions[modalText]} mode`,
      );
      //@ts-ignore
      changeAppVersion(passwordDefinitions[modalText]);
      api.success({
        message: "Success",
        description:
          //@ts-ignore
          t("AppVersion.Change") + passwordDefinitions[modalText].toString(),
        placement: "top",
      });
      setIsModalOpen(false);
    } else {
      console.log("Invalid version");
      api.error({
        message: "Error",
        description: t("AppVersion.Invalid"),
        placement: "top",
      });
    }
  };
  const handleCancel = () => {
    setIsModalOpen(false);
  };
  // Add one more element to the menuItems array
  const myMenuItems = [
    { key: "app", label: t("WelcomeScreen.Start"), icon: <CoffeeOutlined /> },
    { key: "about", label: t("WelcomeScreen.AboutUs"), icon: <InfoCircleOutlined /> },
    { key: "toggle", label: t("WelcomeScreen.DarkMode"), icon: <SettingOutlined /> },
    {
      key: "sentence-mode",
      label: switchText === "sentence" ? t("WelcomeScreen.SwitchToSentence") : t("WelcomeScreen.SwitchToWord"),
      icon: <EditOutlined />,
    },
    {
      key: "lang-switch", label: t("WelcomeScreen.SwitchLang"), icon: <GlobalOutlined />,
    },
    { key: "modal", label:  t("Tour.Change"), icon: <PoweroffOutlined /> },
    { key: "tour", label: t("Tour.Restart"), icon: <QuestionCircleOutlined /> },
  ];
  const { startTour, doTour, setDoTour, currentPage, setCurrentPage } =
    useContext(TourContext);

  const onClickHandler = (key: string) => {
    switch (key) {
      case "toggle":
        toggleDarkMode();
        break;
      case "sentence-mode":
        if (!doTour) {
          setCurrentMode && setCurrentMode(currentMode === "word" ? "sentence" : "word");
        }
        break;
      case "tour":
        if (activeTab === "app" && appStep !== 0) {
          api.warning({
            message: "Warning",
            description: t("Tour.Warning"),
            placement: "top",
          });
          return;
        }
        setCurrentMode && setCurrentMode("word");
        setDoTour(true);
        setCurrentPage(-1);
        break;
      case "modal":
        showModal();
        break;
      case "lang-switch":
        i18n.changeLanguage(i18n.language === "en" ? "fr" : "en");
        break;
      default:
        if (key !== "app" && doTour) return;
        onMenuSelect(key);
        break;
    }
  };

  // Ref Map
  const refMap: Record<string, React.RefObject<HTMLDivElement>> = {};
  refMap["welcome"] = useRef<HTMLDivElement>(null);
  refMap["app"] = useRef<HTMLDivElement>(null);
  refMap["about"] = useRef<HTMLDivElement>(null);
  refMap["toggle"] = useRef<HTMLDivElement>(null);
  refMap["sentence-mode"] = useRef<HTMLDivElement>(null);
  refMap["tour"] = useRef<HTMLDivElement>(null);
  refMap["modal"] = useRef<HTMLDivElement>(null);
  refMap["empty"] = useRef<HTMLDivElement>(null);

  const steps = useMemo(() => {
    const refs: IPageRef[] = [];
    refs.push({
      title: t("Tour.WelcomeTitle"),
      content: t("Tour.WelcomeContent"),
      target: refMap.empty,
      onClose: () => {
        refMap.app.current?.click();
        setCurrentPage(1);
      },
    });
    refs.push({
      title: t("Tour.WelcomeScreenTitle"),
      content: t("Tour.WelcomeScreenContent"),
      target: refMap.welcome,
      onClose: () => {
        refMap.app.current?.click();
        setCurrentPage(1);
      },
    });
    refs.push({
      title: t("Tour.StartCookingTitle"),
      content: t("Tour.StartCookingContent"),
      target: refMap.app,
      onClose: () => {
        refMap.app.current?.click();
        setCurrentPage(1);
      },
    });
    refs.push({
      title: t("Tour.AboutUsTitle"),
      content: t("Tour.AboutUsContent"),
      target: refMap.about,
      onClose: () => {
        refMap.app.current?.click();
        setCurrentPage(1);
      },
    });
    refs.push({
      title: t("Tour.ToggleDarkModeTitle"),
      content: t("Tour.ToggleDarkModeContent"),
      target: refMap.toggle,
      onClose: () => {
        refMap.app.current?.click();
        setCurrentPage(1);
      },
    });
    refs.push({
      title: t("Tour.SwitchToSentenceModeTitle"),
      content: t("Tour.SwitchToSentenceModeContent"),
      target: refMap["sentence-mode"],
      onClose: () => {
        setCurrentPage(1);
        refMap.app.current?.click();
      },
    });
    refs.push({
      title: t("Tour.ChangeAppVersionTitle"),
      content: t("Tour.ChangeAppVersionContent"),
      target: refMap.modal,
      onClose: () => {
        setCurrentPage(1);
        refMap.app.current?.click();
      },
    });
    refs.push({
      title: t("Tour.RestartTourTitle"),
      content: t("Tour.RestartTourContent"),
      target: refMap.tour,
      onClose: () => {
        setCurrentPage(1);
        refMap.app.current?.click();
      },
    });
    return refs;
  }, [refMap, setCurrentPage]);


  useEffect(() => {
    if (!doTour) return;
    if (currentPage === -1) {
      startTour(steps);
      setCurrentPage(0);
    }
  }, [startTour, doTour, currentPage, setCurrentPage]);

  return (
    <div
      className={`welcome-screen ${className}`}
      data-theme={isDarkMode ? "dark" : "light"}
    >
      <Modal
        title={t("WelcomeScreen.ChangeAppMessage")}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <Input
          placeholder={t("WelcomeScreen.PasswordMessage")}
          value={modalText}
          onChange={(e) => setModalText(e.target.value)}
        />
      </Modal>
      <Text className="menu-info-text">
        <ArrowUpOutlined /> {t("WelcomeScreen.HoverMessage")}  <ArrowUpOutlined />
      </Text>
      <span ref={refMap.welcome as React.RefObject<HTMLDivElement>}>
        <List
          header={<div>{t("WelcomeScreen.WelcomeMessage")}</div>}
          dataSource={myMenuItems}
          className="menu-list"
          renderItem={(item) => (
            <List.Item>
              <Button
                type="link"
                size="large"
                icon={item.icon}
                onClick={() => onClickHandler(item.key)}
                className="menu-item-button"
                id={"welcome-menu-" + item.key}
                ref={refMap[item.key]}
              >
                {item.label}
              </Button>
            </List.Item>
          )}
        />
      </span>
    </div>
  );
};

export default WelcomeScreen;
