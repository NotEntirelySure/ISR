import React from 'react';
import UserGlobalHeader from '../../components/UserGlobalHeader';

export default function LandingPage() {

  return (
    <>
      <UserGlobalHeader notificationActive={false} isAuth={false}/>
      <div id="mainContent">
        <div id="imageContainer">
          <img className="homepageImage" src={`${process.env.PUBLIC_URL}/ISR_Homepage.png`} alt=''></img>
        </div>
      </div>
    </>
  );
};