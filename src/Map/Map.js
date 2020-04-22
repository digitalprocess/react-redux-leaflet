import React from 'react'
import { connect } from 'react-redux'
import L from 'leaflet'
import PropTypes from 'prop-types'

import chroma from 'chroma-js'

// defining the container styles the map sits in
const style = {
	width: '100%',
	height: '100vh'
}

// for this app we create two leaflet layer groups to control, one for the isochrone centers and one for the isochrone contours
const markersLayer = L.featureGroup()
const isochronesLayer = L.featureGroup()
const tiles = L.tileLayer('https://{s}.tile.osm.org/{z}/{x}/{y}.png', {
	attribution: '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
})

// we define our bounds of the map
const southWest = L.latLng(-90, -180),
	northEast = L.latLng(90, 180),
	bounds = L.latLngBounds(southWest, northEast)

// a leaflet map consumes parameters, I'd say they are quite self-explanatory
const mapParams = {
	center: [25.95681, -35.729687],
	zoomControl: false,
	maxBounds: bounds,
	zoom: 2,
	layers: [markersLayer, isochronesLayer, tiles]
}

// this you have seen before, we define a react component
class Map extends React.Component {

	static propTypes = {
		isochronesControls: PropTypes.object.isRequired,
		mapEvents: PropTypes.object,
		dispatch: PropTypes.func.isRequired
	}

	// and once the component has mounted we add everything to it
	componentDidMount() {

		// our map!
		this.map = L.map('map', mapParams)

		// we create a leaflet pane which will hold all isochrone polygons with a given opacity
		var isochronesPane = this.map.createPane('isochronesPane')
		isochronesPane.style.opacity = 0.9

		// we do want a zoom control
		L.control
			.zoom({
				position: 'topright'
			})
			.addTo(this.map)

		// and for the sake of advertising your company, you may add a logo to the map
		const brand = L.control({
			position: 'bottomright'
		})
		brand.onAdd = function (map) {
			var div = L.DomUtil.create('div', 'brand')
			div.innerHTML =
				'© Immaculate Javelin'
			return div
		}
		this.map.addControl(brand)
	}

	componentDidUpdate() {
		this.addIsochronesCenter();
		this.addIsochrones();
	}

	addIsochronesCenter() {

		// clear the markers layer beforehand
		markersLayer.clearLayers();

		const isochronesCenter = this.props.isochronesControls.settings
			.isochronesCenter;

		// does this object contain a latitude and longitude?
		if (isochronesCenter.lat && isochronesCenter.lng) {
			// we are creating a leaflet circle marker with a minimal tooltip
			L.circleMarker(isochronesCenter)
				.addTo(markersLayer)
				.bindTooltip(
					"latitude: " +
					isochronesCenter.lat +
					", " +
					"longitude: " +
					isochronesCenter.lng,
					{
						permanent: false
					}
				)
				.openTooltip();

			// set the map view
			this.map.setView(isochronesCenter, 7);
		}
	}

	addIsochrones() {

		isochronesLayer.clearLayers();

		const isochrones = this.props.isochronesControls.isochrones.results;

		// if we have polygons in our response
		if (isochrones.length > 0) {
			let cnt = 0;

			// let's define a beautiful color range
			const scaleHsl = chroma
				.scale(["#f44242", "#f4be41", "#41f497"])
				.mode("hsl")
				.colors(isochrones.length);

			// looping through all polygons and adding them to the map
			for (const isochrone of isochrones) {
				for (const isochroneComponent of isochrone.component) {
					L.polygon(
						isochroneComponent.shape.map(function (coordString) {
							return coordString.split(",");
						}),
						{
							fillColor: scaleHsl[cnt],
							weight: 2,
							opacity: 1,
							color: "white",
							pane: "isochronesPane"
						}
					).addTo(isochronesLayer);
				}
				cnt += 1;
			}

			this.map.fitBounds(isochronesLayer.getBounds())
		}
	}

	// don't forget to render it :-)
	render() {
		return <div id="map" style={style} />
	}
}

// and we already map the redux store to properties which we will start soon
const mapStateToProps = (state) => {
	const isochronesControls = state.isochronesControls
	return {
		isochronesControls
	}
}

export default connect(mapStateToProps)(Map)
