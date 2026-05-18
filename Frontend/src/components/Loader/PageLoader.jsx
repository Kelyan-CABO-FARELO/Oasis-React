import React from "react";
import { SyncLoader } from "react-spinners";

const PageLoader = () => {
    return (
        <div className="bg-black flex flex-col items-center justify-center h-screen">
            <SyncLoader size={75} color="rgba(72, 67, 69, 1)" />
        </div>
    );
};

export default PageLoader;