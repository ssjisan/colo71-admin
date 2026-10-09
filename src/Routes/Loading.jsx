import Lottie from "lottie-react";
import loaderAnimation from "../assets/loader.json";

export default function Loading() {
  return (
    <div
      style={{
        height: "100vh",
        margin: "0",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
      }}
    >
      <Lottie
        animationData={loaderAnimation}
        loop
        style={{ width: 120, height: 120 }}
      />
    </div>
  );
}
