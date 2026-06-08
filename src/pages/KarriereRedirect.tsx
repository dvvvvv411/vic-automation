import { useEffect } from "react";

const TARGET = "https://for-tel.solutions/karriere/onlineprozess-tests";

const KarriereRedirect = () => {
  useEffect(() => {
    window.location.replace(TARGET);
  }, []);
  return null;
};

export default KarriereRedirect;
