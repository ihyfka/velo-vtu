import { getAuth, signInWithCustomToken } from "firebase/auth";
const auth = getAuth();
const handOffToken = sessionStorage.getItem("tempSess");
(async function () {
  if(handOffToken) {
    try {
      const res = await signInWithCustomToken(auth, handOffToken)
      if(res.ok) {
        sessionStorage.removeITem("tempSess");
        console.log("validated via google");
      }
    }catch(err) {
      console.log(err);
    }
  }
}) ();


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
  for(let m=0;m<service.length;m++) {
    service[m].addEventListener("click", (e)=> {
      document.body.style.overflow = "hidden";
      vtOverlay.style.display = "flex";
      vtOverlay.classList.add("modal-vis");
      if(service[1].contains(e.target)) dataModal();
      if(service[2].contains(e.target)) sendModal();
    })
  }
} showInterface();

function hideInterface() {
  if(vtInterface) {
    vtOverlay.addEventListener("click", (e)=> {
      if(!vtInterface.contains(e.target) || closeSvg.contains(e.target)) { //set modals to default
        document.body.style.overflow = "auto";
        vtOverlay.style.display = "none";
        vtOverlay.classList.remove("modal-vis");
      }
    })
  }
} hideInterface();

