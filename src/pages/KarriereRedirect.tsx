const TARGET = "https://for-tel.solutions/karriere/onlineprozess-tests";

const KarriereRedirect = () => {
  return (
    <iframe
      src={TARGET}
      title="Karriere"
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        border: "none",
      }}
    />
  );
};

export default KarriereRedirect;
