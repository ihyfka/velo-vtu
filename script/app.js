import mk7H2mP9vR4 from "../src/resources/images/mk7H2mP9vR4.jpeg";
import ab3N8xQ5zW1 from "../src/resources/images/ab3N8xQ5zW1.jpeg";
import gt9L4fG7sJ2 from "../src/resources/images/gt9L4fG7sJ2.jpg";
import m9p5Z2hN9cX4 from "../src/resources/images/m9p5Z2hN9cX4.jpg";
import sm1V6kY3dR8 from "../src/resources/images/sm1V6kY3dR8.webp";

const service = document.querySelectorAll(".service");
const vtOverlay = document.querySelector("#vt-overlay");
const vtInterface = document.querySelector(".vt-interface");
const vtAmount = document.querySelector(".vt-amount");
const closeSvg = vtOverlay.querySelector("svg");
const formFirstDiv = document.querySelector(".ov-hook");
const mCarrier = document.querySelector(".carrier");
const userPhone = document.querySelector(".user-inp");
const editNum = document.querySelector(".recipient-num-change");

const air = document.querySelector(".air");
const data = document.querySelector(".data");
const send = document.querySelector(".send");

Object.assign(userPhone.style, {
  fontSize: "1.3rem",
  borderBottom: "1px solid var(--text-dark)",
  transition: "border-bottom .3s ease",
})
userPhone.addEventListener("input", async (e)=> {
  e.target.value = e.target.value.replace(/[^0-9]/g, "");
  if(userPhone.value.length > userPhone.maxLength) return userPhone.value = userPhone.value.slice(0, userPhone.maxLength);
  if(userPhone.value.length === 11) { /* start call  */
    mCarrier.classList.add("vis");
    let verifiedNum = userPhone.value;
    let exp = verifiedNum.replace(/\D/g, "");
    if(exp.startsWith("0") && exp.length === 11) exp = "%2B234" + exp.substring(1);
    vtOverlay.style.display = "flex";
    try {
      const res = await fetch(`/mobile/validate?phone=${exp}`);
      if(!res.ok) {
        mCarrier.classList.remove("vis");
        throw new Error(`Query failed, status code: ${res.status}`);
      }else {
        const data = await res.json();
        console.log(mCarrier, data.carrier);
        mCarrier.classList.remove("vis");
        mCarrier.style.filter = "grayscale(0) brightness(1)";
        if(data.carrier === "MTN") mCarrier.src = mk7H2mP9vR4;
        else if(data.carrier === "Airtel") mCarrier.src = ab3N8xQ5zW1;
        else if(data.carrier === "Glo") mCarrier.src = gt9L4fG7sJ2;
        else if(data.carrier === "9mobile") mCarrier.src = m9p5Z2hN9cX4;
        else if(data.carrier === "Smile") mCarrier.src = sm1V6kY3dR8;
        else return;
        const editedNum = document.createElement("p");
        editedNum.classList.add("recipient-num");
        editedNum.textContent = verifiedNum;
        userPhone?.replaceWith(editedNum);
        editNum.textContent = "Edit number";
        Object.assign(editNum.style, {
          fontSize: "1rem",
          color: "var(--soft-b)",
          cursor: "pointer",
        })
      }
    }catch(err) {
      console.log(err)
    }
  }
})


editNum.addEventListener("click", (e)=> {
  e.preventDefault();
  const editedNo = document.querySelector(".recipient-num");
  editedNo.textContent = "Enter number";
  editNum.textContent = "Enter number";
  Object.assign(editNum.style, {
    color: "var(--p-light)",
    fontSize: "1rem"
  })
  editedNo?.replaceWith(userPhone);
})

function airtimeModal() {
  vtAmount.style.display = "flex";
  options.innerHTML = `
    <div class="pdf-amt"><span>&#8358;</span>50</div>
    <div class="pdf-amt"><span>&#8358;</span>100</div>
    <div class="pdf-amt"><span>&#8358;</span>200</div>
    <div class="pdf-amt"><span>&#8358;</span>500</div>
    <div class="pdf-amt"><span>&#8358;</span>1000</div>
    <div class="pdf-amt"><span>&#8358;</span>2000</div>
  `;
}

function dataModal() {
  vtInterface.style.paddingBottom = "2rem";
  document.querySelector(".vt-action").textContent = "Buy Data";
  vtAmount.style.display = "none";
  const options = document.querySelector("#options"); 
  options.classList.add("data-sec");
  options.innerHTML = `
    <div class="pdf-amt">
      <p>7 DAYS</p>
      <p class="amt">1<span class="bytes">GB</span></p>
      <span>&#8358;</span>50
    </div>

    <div class="pdf-amt">
      <p>7 DAYS</p>
      <p class="amt">1<span class="bytes">GB</span></p>
      <span>&#8358;</span>50
    </div>

    <div class="pdf-amt">
      <p>7 DAYS</p>
      <p class="amt">1<span class="bytes">GB</span></p>
      <span>&#8358;</span>50
    </div>

    <div class="pdf-amt">
      <p>7 DAYS</p>
      <p class="amt">1<span class="bytes">GB</span></p>
      <span>&#8358;</span>50
    </div>

    <div class="pdf-amt">
      <p>7 DAYS</p>
      <p class="amt">1<span class="bytes">GB</span></p>
      <span>&#8358;</span>50
    </div>

    <div class="pdf-amt">
      <p>7 DAYS</p>
      <p class="amt">1<span class="bytes">GB</span></p>
      <span>&#8358;</span>50
    </div>

    <div class="pdf-amt">
      <p>7 DAYS</p>
      <p class="amt">1<span class="bytes">GB</span></p>
      <span>&#8358;</span>50
    </div>

    <div class="pdf-amt">
      <p>7 DAYS</p>
      <p class="amt">1<span class="bytes">GB</span></p>
      <span>&#8358;</span>50
    </div>

    <div class="pdf-amt">
      <p>7 DAYS</p>
      <p class="amt">1<span class="bytes">GB</span></p>
      <span>&#8358;</span>50
    </div>
  `
}

function sendModal() {
  vtInterface.style.display = "none";
}

function showInterface() {
  for(let m=0;m<service.length;m++) {
    service[m].addEventListener("click", (e)=> {
      document.body.style.overflow = "hidden";
      vtOverlay.style.display = "flex";
      vtOverlay.classList.add("modal-vis");
      if(service[0].contains(e.target)) airtimeModal();
      else if(service[1].contains(e.target)) dataModal();
      else if(service[2].contains(e.target)) return console.log("fish");
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

const tznStatusContainer = document.querySelectorAll(".tzn-cold-status");
tznStatusContainer.forEach(tsc => {
  const tznSvg = tsc.querySelector(".tzn-svg");
  if(tznSvg.classList.contains("success-status")) {
    tsc.dataset.status = "successful";
  }else if(tznSvg.classList.contains("failed-status")) {
    tsc.dataset.status = "failed";
  }
})
