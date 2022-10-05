import React from 'react';

const AdminHomePage = () => {
  return (
    <>
      <div id="mainContent">
        <div id="imageContainer">
          <img className="homepageImage" src={`${process.env.PUBLIC_URL}/ISR_Homepage.png`} alt=""></img>
        </div>
      </div>
    </>
  );
};

export default AdminHomePage;