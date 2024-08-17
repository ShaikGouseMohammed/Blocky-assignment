import React, { useRef, useState, useEffect } from 'react';
import { useJsApiLoader, GoogleMap, MarkerF, Autocomplete, DirectionsRenderer } from "@react-google-maps/api";
import { AiOutlinePlusCircle } from "react-icons/ai";
import "../css/map.css";
import button from "../assets/location-pin.png";
import originIcon from "../assets/OriginIcon.png";
import destinationIcon from "../assets/DestinationIcon.png";
import stopIcon from "../assets/StopIcon.png";
import Car from "../assets/Car.png";

const Home = () => {
    const google = window.google;
     
    const [origin, setOrigin] = useState(null);
    const [destination, setDestination] = useState(null);
    const [loading, setLoading] = useState(false);
    const [directionsRes, setDirectionsRes] = useState(null);
    const [distance, setDistance] = useState('');
    const [time, setTime] = useState('');
    const [routes, setRoutes] = useState([]);
    const [waypoints, setWaypoints] = useState([]);
    const [originLoc, setOriginLoc] = useState({ lat: 0, lng: 0 });
    const [destinationLoc, setDestinationLoc] = useState({ lat: 0, lng: 0 });
    const [movingMarker, setMovingMarker] = useState(null);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);

    const originRef = useRef();
    const destinationRef = useRef();
    const waypointRef = useRef();

    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: "AIzaSyBapAiSYukTGtSuJTilyGnbDoXGp3lt16Y",
        libraries: ['places','geometry'],
    });

    const center = { lat: 28.6567, lng: 77.2415 };

    useEffect(() => {
        if (directionsRes) {
            const steps = directionsRes.routes[0].legs[0].steps;
            animateMarker(steps);
        }
    }, [directionsRes]);

    if (!isLoaded) {
        return <p>Loading ...</p>;
    }

    async function calculateRoute() {
        if (originRef.current.value === '' || destinationRef.current.value === '') {
            return;
        }
        setLoading(true);
        const directionService = new google.maps.DirectionsService();
        const routeOptions = {
            origin: originRef.current.value,
            destination: destinationRef.current.value,
            waypoints: [...waypoints.map(waypoint => ({ location: waypoint.location }))],
            travelMode: google.maps.TravelMode.DRIVING,
            provideRouteAlternatives: true
        };
        const results = await new Promise((resolve, reject) => {
            directionService.route(routeOptions, (response, status) => {
                if (status === 'OK') {
                    resolve(response);
                } else {
                    reject(status);
                    window.alert('Directions request failed due to ' + status);
                }
            });
        });

        setOrigin(originRef.current.value);
        setDestination(destinationRef.current.value);
        setLoading(false);
        setDirectionsRes(results);
        setDistance(results.routes[0].legs[0].distance.text);
        setTime(results.routes[0].legs[0].duration.text);
        setRoutes(results.routes);

        const originLatLng = results.routes[0].legs[0].start_location; 
        const destinationLatLng = results.routes[0].legs[0].end_location;

        setOriginLoc(originLatLng);
        setDestinationLoc(destinationLatLng);
        setMovingMarker(originLatLng);  
    }
    
    const animateMarker = (steps) => {
        let stepIndex = 0;
        let progress = 0; 
        const move = () => {
            if (stepIndex >= steps.length) return;
    
            const start = steps[stepIndex].start_location;
            const end = steps[stepIndex].end_location;
    
          
            const totalDistance = google.maps.geometry.spherical.computeDistanceBetween(start, end);
    
            // Speed in meters per second for 27 km/h
            const speedInMetersPerSecond = 22;
    
            
            const totalTimeInSeconds = totalDistance / speedInMetersPerSecond;
            setTime(totalTimeInSeconds)
          
            const distancePerSecond = speedInMetersPerSecond;
    
            
            const interpolatePosition = (start, end, fraction) => {
                const lat = start.lat() + (end.lat() - start.lat()) * fraction;
                const lng = start.lng() + (end.lng() - start.lng()) * fraction;
                return new google.maps.LatLng(lat, lng);
            };
    
            const updatePosition = () => {
              
                progress += distancePerSecond;
    
                if (progress >= totalDistance) {
                    // Move to the next step
                    stepIndex++;
                    progress = 0;
    
                    // If the last step is completed, stop the animation
                    if (stepIndex >= steps.length) return;
    
                    move();
                } else {
                 
                    const fractionCovered = progress / totalDistance;
                    const newPosition = interpolatePosition(start, end, fractionCovered);
    
                    setMovingMarker(newPosition);
    
                    setTimeout(updatePosition, 1000); // Update every second
                }
            };
    
            updatePosition();
        };
    
        move();
    };
    
    const handleAddWaypoint = () => {
        const newWaypoint = { location: waypointRef.current.value };
        setWaypoints(prevWaypoints => [...prevWaypoints, newWaypoint]);
        waypointRef.current.value = '';
    };

    return (
        <div className="home">
            <div className="container">
                <p className='heading'>Let's Make a  <span style={{ fontWeight: "1000" }}> Vehicle Tracking App</span> from Google maps</p>
                <div className="content-container">
                    <div className="locations">
                        <div className="location-container">
                            <div className="location-inputs">
                                <div className="origin">
                                    <label htmlFor="1">Origin</label>
                                    <div className="input-container">
                                        <Autocomplete>
                                            <input type="text" className='input1' placeholder='Start' id='1' ref={originRef} />
                                        </Autocomplete>
                                    </div>
                                </div>
                             
                              
                                <div className="destination">
                                    <label htmlFor="3">Destination</label>
                                    <Autocomplete>
                                        <input type="text" className='input3' placeholder='End' id='3' ref={destinationRef} />
                                    </Autocomplete>
                                </div>
                            </div>
                            <div className="location-buttons">
                                <button className="calc-btn" onClick={calculateRoute}>
                                  Submit
                                </button>
                            </div>
                        </div>
                        <div className="distance">
                            <div className="distance-number">
                                <p style={{ fontWeight: "900", fontSize: "18px" }}>Distance</p>
                                <p className='distance-style-number'>{distance}</p>
                            </div>
                            <div className='distance-text'>
                                {!loading ? (
                                    <p>The distance between <span style={{ fontWeight: "800" }}>{origin}</span> and <span style={{ fontWeight: "800" }}>{destination}</span> via the selected route is <span style={{ fontWeight: "800" }}>{distance}</span>.The Time Taken to Reach is {Math.floor(time)}</p>
                                ) : (
                                    <p>Please select a route.</p>
                                )}
                                {loading && <div className="loading">Loading...</div>}
                            </div>
                        </div>
                    </div>
                    <div className="render-map-box">
                        <GoogleMap
                         
                            zoom={12}
                            mapContainerStyle={{ width: '100%', height: '100%' }}
                            options={{
                                streetViewControl: false,
                                mapTypeControl: false,
                                fullscreenControl: false,
                                disableDefaultUI: true,
                            }}
                        >
                            <MarkerF position={center} clickable={false} icon={{
                                url: button,
                                scaledSize: new window.google.maps.Size(30, 30),
                            }} />

                            {movingMarker && (
                                <MarkerF position={movingMarker} clickable={false} icon={{
                                    url: Car,  // You can replace this with a custom icon for the moving marker
                                    scaledSize: new window.google.maps.Size(30, 30),
                                }}
                                />
                            )}

                            <MarkerF position={originLoc} clickable={false} icon={{
                               
                                scaledSize: new window.google.maps.Size(30, 30),
                            }}
                                zIndex={10}
                            />

                            <MarkerF position={destinationLoc} clickable={false} icon={{
                               
                                scaledSize: new window.google.maps.Size(30, 30),
                            }}
                                zIndex={10}
                            />
                            {directionsRes && <DirectionsRenderer directions={directionsRes} />}
                        </GoogleMap>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Home;
