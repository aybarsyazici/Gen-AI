import React, { useMemo } from "react";
import { Steps } from "antd";
import { useTranslation } from "react-i18next";

type GuiderProps = {
  currentStep: number;
};

export const Guider: React.FC<GuiderProps> = ({ currentStep }) => {
  const { t } = useTranslation();

  const descriptions = useMemo(
    () =>
      [
        t("guider.step1Description"),
        t("guider.step2Description"),
        t("guider.step3Description"),
        t("guider.step4Description"),
      ].map((description, index) => {
        if (index === currentStep) {
          return description;
        }
        return "";
      }),
    [currentStep, t],
  );

  return (
    <Steps
      current={currentStep}
      items={[
        {
          title: t("guider.step1Title"),
          description: descriptions[0],
        },
        {
          title: t("guider.step2Title"),
          description: descriptions[1],
        },
        {
          title: t("guider.step3Title"),
          description: descriptions[2],
        },
        {
          title: t("guider.step4Title"),
          description: descriptions[3],
        },
      ]}
    />
  );
};

export default Guider;