//Declare global variables
var map;
var center;
var infoWindow;
var placesService;
var autoSearch;
var results = [];
var markers = [];
var currentMarker;
var placesList = ko.observableArray([]);
var place = function(data) {
	this.placeId = ko.observable(data.placeId);
	this.title = ko.observable(data.title);
	this.position = ko.observable(data.position);
	this.map = ko.observable(data.map);
	this.animation = ko.observable(data.animation);
}

//Function to initialize the map
function initMap() {
	map = new google.maps.Map(document.getElementById('map'), {
		center: {lat: 37.570750, lng: -122.337088},
		zoom: 15
	});

	center = map.getCenter();

	infoWindow = new google.maps.InfoWindow({
		content: '<h4><a id="location-website" href=""></a></h4><img id="location-image"><br><br><span id="location-vicinity"></span>'
	});

	google.maps.event.addListener(infoWindow, 'closeclick', function() {
	   if (currentMarker) {
			deselectMarker();
		}
	});

	placesService = new google.maps.places.PlacesService(map);

	//Add an event listener on the Filter Text Box
	markerFilter = document.getElementById('marker-filter');

	markerFilter.addEventListener('keyup', function() {
		var searchTerm = markerFilter.value.toLowerCase();
		console.log(searchTerm);
		for (i = 0; i < markers.length; i++) {
			if (!markers[i].title.toLowerCase().includes(searchTerm)) {
				if (currentMarker && currentMarker.placeId == markers[i].placeId) {
					infoWindow.close();
					deselectMarker();
				}
				markers[i].setMap(null);
			}
			else {
				if (!markers[i].map) {
					markers[i].setMap(map);
					markers[i].setAnimation(google.maps.Animation.DROP);
				}
			}
		}
		updateList();
	})

	//Add an event listener on the "Auto Redo Search" checkbox, to show/hide the "Redo Search" button
	document.getElementById('auto-redo-search').addEventListener('change', function() {
 		if (this.checked) {
 			document.getElementById('redo-search').hidden = true;
 		} else {
 			document.getElementById('redo-search').hidden = false;
 		}
 	})

 	//Add an event listener on the "Redo Search" button to search for places using the new center of the map
 	document.getElementById('redo-search').addEventListener('click', function() {
 		if (currentMarker) {
			deselectMarker();
		}
 		center = map.getCenter();
 		getPlaces(center);
 	})

	google.maps.event.addListener(map, 'dragend', function() {
		if (currentMarker) {
			deselectMarker();
		}
	   	center = map.getCenter();
	   	autoSearch = document.getElementById('auto-redo-search').checked;
	   	if (autoSearch) {
	   		getPlaces(center);
        }
    });
	getPlaces(center);
}

//Function to initialize the List
function initList(results) {
	var ViewModel = function() {
		var self = this;

		results.forEach(function(placeItem) {
			placesList.push(new place(placeItem));
		})
	}

	ko.applyBindings(new ViewModel());
}

//Initialize the List
initList(results);

//Function to update the List
function updateList() {
	placesList([]);
	markers.forEach(function(placeItem) {
		if (placeItem.map) {
			placesList.push(new place(placeItem));
		}
		else {

		}
	})
}

function selectMarkerFromList(place) {
	placeId = place.placeId();
	for (i = 0; i < markers.length; i++) {
		if (markers[i].placeId == placeId) {
			selectMarker(markers[i]);
		}
	}
}

//Function to get places using Nearby Search from Google JavaScript API
function getPlaces(center) {

	var searchRequest = {
		location: center,
		radius: 2000,
		type: ['restaurant']
	}

	placesService.nearbySearch(searchRequest, searchCallback);

	function searchCallback(results, status) {
		if (status != google.maps.places.PlacesServiceStatus.OK) {
			console.log("There is a problem.");
		}
		else {
			console.log(results);
			placeMarkers(results);
		}
	}
}

//Function to place markers on the map
function placeMarkers(results) {
	console.log(results);
	deleteAllMarkers();
	for (i = 0; i < results.length; i++) {

		var marker = new google.maps.Marker({
			placeId: results[i].place_id,
			title: results[i].name,
			position: results[i].geometry.location,
			map: map,
			animation: google.maps.Animation.DROP
		})

		markers.push(marker);

		marker.addListener('click', function() {
			selectMarker(this);
		})
	}
	updateList();
}

//Select the current marker
function selectMarker(marker) {
	if (!currentMarker) {
		currentMarker = marker;
		marker.setAnimation(google.maps.Animation.BOUNCE);
		getPlaceDetails(marker, marker.placeId);
	}
	else if (currentMarker && marker == currentMarker) {
	}
	else if (currentMarker && marker != currentMarker) {
		deselectMarker();
		currentMarker = marker;
		marker.setAnimation(google.maps.Animation.BOUNCE);
		getPlaceDetails(marker, marker.placeId);
	}
}

//Deselect the current marker
function deselectMarker() {
	currentMarker.setAnimation(null);
	currentMarker = undefined;
}

//Function to set a map on all markers
function setMapOnAllMarkers(map) {
	for (var i = 0; i < markers.length; i++) {
	  markers[i].setMap(map);
	}
}

//Function to hide all the markers on the map
function hideAllMarkers() {
	setMapOnAllMarkers(null);
}

//Function to show all markers on the map
function showAllMarkers() {
	setMapOnAllMarkers(map);
}

//Function to delete all markers from the array
function deleteAllMarkers() {
	hideAllMarkers();
	markers = [];
}

//Function to get place details from Google Place Details API
function getPlaceDetails(marker, placeId) {

	detailsRequest = {
		  placeId: placeId
	};

	placesService.getDetails(detailsRequest, detailsCallback);

	function detailsCallback(place, status) {
	  if (status != google.maps.places.PlacesServiceStatus.OK) {
	  	console.log("There is a problem.");
	  } else {
	  	console.log(place);
	  	infoWindow.open(map, marker);
	  	if (place.name) {
	  		document.getElementById('location-website').innerHTML = place.name;
	  	} else {
	  		document.getElementById('location-website').innerHTML = ''
	  	}
	  	if (place.website) {
	  		document.getElementById('location-website').href = place.website;
	  	} else {
	  		document.getElementById('location-website').href = '#'
	  	}
	  	if (place.vicinity) {
	  		document.getElementById('location-vicinity').innerHTML = place.vicinity;
	  	} else {
	  		document.getElementById('location-vicinity').innerHTML = ''
	  	}
	  	if (place.photos) {
			document.getElementById('location-image').src = place.photos[0].getUrl({'maxWidth': 140, 'maxHeight': 140})
		} else {
			document.getElementById('location-image').src = ''
		}
	  }
	}

}
