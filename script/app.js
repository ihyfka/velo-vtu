const service = document.querySelectorAll(".service");
const vtOverlay = document.querySelector("#vt-overlay");
const vtInterface = document.querySelector(".vt-interface");
const closeSvg = vtOverlay.querySelector("svg");

const air = document.querySelector(".air");
const data = document.querySelector(".data");
const send = document.querySelector(".send");


const tznStatusContainer = document.querySelectorAll(".tzn-cold-status");
tznStatusContainer.forEach(tsc => {
  const tznSvg = tsc.querySelector(".tzn-svg");
  if(tznSvg.classList.contains("success-status")) {
    tsc.dataset.status = "successful";
  }else if(tznSvg.classList.contains("failed-status")) {
    tsc.dataset.status = "failed";
  }
})




function showInterface() {
  // service[0].addEventListener("click", airtimeModal);
  // service[1].addEventListener("click", dataModal);
  // service[2].addEventListener("click", sendModal);


  
  for(let m=0;m<service.length;m++) {
    service[m].addEventListener("click", ()=> {
      vtOverlay.style.display = "flex";
      vtOverlay.classList.add("modal-vis");
    })
  }
}
showInterface();


function hideInterface() {
  if(vtInterface) {
    vtOverlay.addEventListener("click", (e)=> {
      if(!vtInterface.contains(e.target) || closeSvg.contains(e.target)) {
        vtOverlay.style.display = "none";
        vtOverlay.classList.remove("modal-vis");
      }
    })
  }
}
hideInterface();









// import { onAuthStateChanged } from "firebase/auth";
// import { initLoader, startFirebase } from "./login";
// const pfp = document.querySelector(".pfp");

// /* start the dashboard */
// async function initDashboard() {
//   initLoader(false); 
//   onAuthStateChanged(auth, async (user) => {
//     if(user) {
//       console.log("User authenticated"); // debugging log
//       const userName = user.displayName;
//       const userEmail = user.email;
//       const userPhone = user.phoneNumber;
//       const userPhotoURL = user.photoURL;
//       document.querySelector(".verified-username").textContent = userName;
//     }else {
//       console.log("No user is signed in.");
//       window.location.replace("/login"); 
//     }
//   });
// }
// initDashboard();

// /* cookie reader */
// function getCookie(name) {
//     const value = `; ${document.cookie}`;
//     const parts = value.split(`; ${name}=`);
//     if (parts.length === 2) return parts.pop().split(';').shift();
// }
// const userCookie = getCookie('userInfo');
// if(userCookie) {
//     // Cookies are URL encoded, so decode them first
//   const user = JSON.parse(decodeURIComponent(userCookie));  
//   document.querySelector(".verified-username").textContent = user.name;
//   pfp.src = user.picture;
//   pfp.onerror = ()=> pfp.src='/src/resources/images/neutral.png';
// }









// /* start the animation if redirect=true from google */
// // document.addEventListener("DOMContentLoaded", ()=>{
// //   const reParams = new URLSearchParams(window.location.search);
// //   if(reParams.get("redirectSuccess") === "true") {
// //     //initLoader(true); add another loading animation on dashboard load 
// //     window.history.replaceState({}, document.title, "/dashboard");
// //   }
// // })

















// // function showLoadingScreen(isLoading) {
// //   const loader = document.getElementById("loader");
  
// //   if (!loader) return; // Safety check

// //   if (isLoading) {
// //     loader.style.opacity = "1";
// //     loader.style.pointerEvents = "all"; // Block clicks while loading
// //     loader.style.display = "flex"; 
// //   } else {
// //     // Fade out effect
// //     loader.style.opacity = "0";
// //     loader.style.pointerEvents = "none"; // Allow clicks through the hidden loader
    
// //     // Optional: Completely remove from layout after fade is done
// //     setTimeout(() => {
// //       loader.style.display = "none";
// //     }, 300); 
// //   }
// // }