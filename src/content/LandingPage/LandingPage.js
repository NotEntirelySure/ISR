import React from 'react';
import UserGlobalHeader from '../../components/UserGlobalHeader';
import {Header, HeaderName} from '@carbon/react';

export default function LandingPage() {

  return (
    <>
      <UserGlobalHeader/>
      <div id="mainContent">
        <div id="imageContainer">
          <img className="homepageImage" src={`${process.env.PUBLIC_URL}/ISR_Homepage.png`} alt=''></img>
        </div>
      </div>
    </>
  );
};