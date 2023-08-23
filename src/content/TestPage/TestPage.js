import React, {useState, useEffect} from "react";

export default function TestPage() {

  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    handleScreenChange();
    window.addEventListener('resize', handleScreenChange);
    return () => window.removeEventListener('resize', handleScreenChange);
  },[])

  function handleScreenChange() {
    if (window.innerWidth <1000) setIsSmallScreen(true);
    else {setIsSmallScreen(false);}
  }
  return (
    <>
      <div className="adminPageBody">Window size is small? {isSmallScreen ? 'yes':'no'}</div>
    </>
  )
};