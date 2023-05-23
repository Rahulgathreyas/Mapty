'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

let map,mapEvent;

class WorkOut{
    date=new Date();
    id=(Date.now() + '').slice(-10);
    clicks=0;   
    constructor(coords,distance,duration) {
        this.coords=coords;//Array of latitude ANd longitude
        this.distance=distance;//in km
        this.duration=duration;//in min
        
    }
    _setDescription()  {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        this.description=`${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.
            getMonth()]} ${this.date.getDate()}`;
    }
    click() {
        this.clicks++;
    }
}
class  Running extends WorkOut {
    type='running';

    constructor(coords,distance,duration,cadance) {
        super(coords,distance,duration);
        this.cadance=cadance;
        this.calcPace();
        this._setDescription();
    }
    calcPace() {
        //Mins/Km
        this.pace=this.duration/this.distance;
        return this.pace;
    }
}
class  Cycling extends WorkOut {
    type='cycling';
    constructor(coords,distance,duration,elevationGain) {
        super(coords,distance,duration);
        this.elevationGain=elevationGain;
        //this.type='cycling';
        this.calcSpeed();
        this._setDescription();
    }
    calcSpeed() {
        this.speed=this.distance/(this.duration/60);
        return this.speed;
    }
}

/////////////////////////////////////////////////////////////////////////////
//Application Arcitecture
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');


class App{
    #map;
    #mapEvent;
    #workouts=[];
    #mapZoomLevel = 13;
    constructor() {
        //Get usersposition
        this._getPosition();
        //Get data from local storage
        this._getLocalStorage();
        //Attach event handlers
        form.addEventListener('submit',this._newWorkOut.bind(this));
            inputType.addEventListener('change', this._toggleElevationField);
            containerWorkouts.addEventListener('click',this._moveToPopup.bind(this));
    }
    _getPosition(){
            if(navigator.geolocation)
    navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function(){
        alert('Could not get the position');
    });
    }
    _loadMap(position) {
        const {latitude}=position.coords;
        const {longitude}=position.coords;
        console.log(latitude,longitude);
        console.log(`https://www.google.com/maps/@${latitude},${longitude}`);
        const cords=[latitude,longitude];

         this.#map = L.map('map').setView(cords, this.#mapZoomLevel);

        L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);

        //handling clicks on map
        this.#map.on('click', this._showForm.bind(this));

        /////////////////////////////////
        this.#workouts.forEach(work=> {
            //this._renderWorkOut(work);
            this._renderWorkOutMarker(work);
        });
    }
    _hideForm() {
        //Empty inputs 
        inputDistance.value=inputDuration.value=inputCadence.value=inputElevation.value='';    
        form.style.display='none';
        form.classList.add('hidden');
        setTimeout(()=>(form.style.display='grid'),1000);
    }
    _showForm(mapE) {
        this.#mapEvent=mapE;
        form.classList.remove('hidden');
        inputDistance.focus();
            
    }

    _toggleElevationField() {
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    }

    _newWorkOut(e) {
        const validInputs=(...inputs) =>
        inputs.every(inp => Number.isFinite(inp));
        const allPositive=(...inputs) => inputs.every(inp => inp>0);
        e.preventDefault();
        //Get data from form
        const type=inputType.value;
        const distance=+inputDistance.value;
        const duration=+inputDuration.value;
        const { lat, lng }=this.#mapEvent.latlng;
        let workout;
        //If workout running ,create running object
        if(type==='running') {
            const cadance=+inputCadence.value;

            //Check weather the data is valid
            if(
            // !Number.isFinite(distance) ||
            // !Number.isFinite(duration) ||
            // !Number.isFinite(cadance)
            !validInputs(distance,duration,cadance) || !allPositive(distance,duration,cadance)
            )  
                 return alert('Input has to positive numbers')
            workout=new Running([lat,lng],distance,duration,cadance);
            

        }
        //If workout cycling ,create cycling object
        if(type==='cycling') {
            const elevation=+inputElevation.value;
            if(!validInputs(distance,duration,elevation)|| !allPositive(distance,duration)) 
                return alert('Input has to positive numbers');
                workout=new Cycling([lat,lng],distance,duration,elevation);
        }
        //Add new object
        this.#workouts.push(workout);
        console.log(workout);
        //Rennder on map as marker
        this._renderWorkOutMarker(workout);
        //Render workout on list
        this._renderWorkOut(workout);
        //Hide form d clear input fields
        this._hideForm();
            //Clear Input Fields
            //inputDistance.value=inputDuration.value=inputCadence.value=inputElevation.value='';    
            //Set local storage to all workouts
            this._setLocalStorage();     
    }

    _renderWorkOutMarker(workout) {
        L.marker(workout.coords).addTo(this.#map).bindPopup(
            L.popup({
                maxWidth:250,
                minWidth:100,
                autoClose:false,
                closeOnClick:false,
                className:`${workout.type}-popup`,
            })
        )
        .setPopupContent(`${workout.type==='running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`)
        .openPopup();
        
    }
    _renderWorkOut(workout) {
        let html=`
        <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${
                workout.type==='running' ? '🏃‍♂️' : '🚴‍♀️'}
                </span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
        `;
        if(workout.type==='running')
            html+=`
            <div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${workout.pace.toFixed(1)}</span>
                <span class="workout__unit">min/km</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">🦶🏼</span>
                <span class="workout__value">${workout.cadance}</span>
                <span class="workout__unit">spm</span>
            </div>
            `;
            if(workout.type==='cycling')
            html+=`
            <div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${workout.speed.toFixed(1)}</span>
                <span class="workout__unit">km/h</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">⛰</span>
                <span class="workout__value">${workout.elevationGain}</span>
                <span class="workout__unit">m</span>
            </div>
            `;

          form.insertAdjacentHTML('afterend',html);
    }
    _moveToPopup(e) {
            const workoutEl=e.target.closest('.workout');
            console.log(workoutEl);
            if(!workoutEl) return;

            const workout=this.#workouts.find(
                work => work.id === workoutEl.dataset.id);
           console.log(workout);
            this.#map.setView(workout.coords, this.#mapZoomLevel, {
                animate:true,
                pan:{
                    duration:1,
                },
            });
            //using publicInterface
            //workout.click();
    }
    _setLocalStorage() {
        localStorage.setItem('workouts', JSON.stringify(this.#workouts));
    }
    _getLocalStorage() {
        const data=JSON.parse(localStorage.getItem('workouts'));
        console.log(data); 
        if(!data) return;
        this.#workouts=data;
        this.#workouts.forEach(work=> {
            this._renderWorkOut(work);
            //this._renderWorkOutMarker(work);
        });
    }
    reset() {
        localStorage.removeItem('workouts');
        location.reload();
    }
}

const app=new App(); 

