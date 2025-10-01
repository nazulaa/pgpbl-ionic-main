import { Component, OnInit, inject } from '@angular/core';
import { NavController, AlertController } from '@ionic/angular';
import { DataService } from '../data.service';
import * as L from 'leaflet';
import { icon, Marker } from 'leaflet';
import { ActivatedRoute } from '@angular/router';

const iconRetinaUrl = 'assets/marker-icon-2x.png';
const iconUrl = 'assets/marker-icon.png';
const shadowUrl = 'assets/marker-shadow.png';
const iconDefault = icon({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});
Marker.prototype.options.icon = iconDefault;

@Component({
  selector: 'app-createpoint',
  templateUrl: './createpoint.page.html',
  styleUrls: ['./createpoint.page.scss'],
  standalone: false,
})
export class CreatepointPage implements OnInit {
  map!: L.Map;
  name = '';
  coordinates = '';
  title = 'Create Point';
  pointId: string | null = null;

  private navCtrl = inject(NavController);
  private alertCtrl = inject(AlertController);
  private dataService = inject(DataService);
  private route = inject(ActivatedRoute);

  constructor() { }

  ngOnInit() {
    this.pointId = this.route.snapshot.paramMap.get('id');
    if (this.pointId) {
      this.title = 'Edit Point';
      this.dataService.getPoint(this.pointId).then(snapshot => {
        const point = snapshot.val();
        if (point) {
          this.name = point.name;
          this.coordinates = point.coordinates;
          this.setupMap(this.coordinates);
        } else {
          // Handle case where point is not found
          this.setupMap();
        }
      });
    } else {
      this.setupMap();
    }
  }

  setupMap(initialCoordinates?: string) {
    let coords: L.LatLngExpression = [-7.7956, 110.3695]; // Default coordinates
    if (initialCoordinates) {
      const parts = initialCoordinates.split(',').map(c => parseFloat(c));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        coords = [parts[0], parts[1]];
      }
    }

    setTimeout(() => {
      this.map = L.map('mapcreate').setView(coords, 13);
      var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      });
      var esri = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'ESRI'
      });
      osm.addTo(this.map);
      var baseMaps = {
        "OpenStreetMap": osm,
        "Esri World Imagery": esri
      };
      L.control.layers(baseMaps).addTo(this.map);

      var tooltip = 'Drag the marker or move the map<br>to change the coordinates<br>of the location';
      var marker = L.marker(coords, { draggable: true });
      marker.addTo(this.map);
      marker.bindPopup(tooltip);
      marker.openPopup();

      marker.on('dragend', (e) => {
        let latlng = e.target.getLatLng();
        let lat = latlng.lat.toFixed(9);
        let lng = latlng.lng.toFixed(9);
        this.coordinates = lat + ',' + lng;
        console.log(this.coordinates);
      });
    });
  }

  async save() {
    if (this.name && this.coordinates) {
      try {
        if (this.pointId) {
          await this.dataService.updatePoint(this.pointId, { name: this.name, coordinates: this.coordinates });
        } else {
          await this.dataService.savePoint({ name: this.name, coordinates: this.coordinates });
        }
        this.navCtrl.back();
      } catch (error: any) {
        const alert = await this.alertCtrl.create({
          header: 'Save Failed',
          message: error.message,
          buttons: ['OK'],
        });
        await alert.present();
      }
    }
  }
}