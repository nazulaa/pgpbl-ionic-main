import { Component, OnInit, inject } from '@angular/core';
import * as L from 'leaflet';
import { DataService } from '../data.service';
import { AlertController, NavController } from '@ionic/angular';

const iconRetinaUrl = 'assets/marker-icon-2x.png';
const iconUrl = 'assets/marker-icon.png';
const shadowUrl = 'assets/marker-shadow.png';
const iconDefault = L.icon({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = iconDefault;

@Component({
  selector: 'app-maps',
  templateUrl: './maps.page.html',
  styleUrls: ['./maps.page.scss'],
  standalone: false,
})
export class MapsPage implements OnInit {
  private dataService = inject(DataService);
  map!: L.Map;

  constructor(private alertController: AlertController, private navCtrl: NavController) { }

  async loadPoints() {
    const points: any = await this.dataService.getPoints();
    for (const key in points) {
      if (points.hasOwnProperty(key)) {
        const point = points[key];
        const coordinates = point.coordinates.split(',').map((c: string) => parseFloat(c));
        const marker = L.marker(coordinates as L.LatLngExpression).addTo(this.map);

        const popupContent = document.createElement('div');

        const nameEl = document.createElement('b');
        nameEl.innerText = point.name;
        popupContent.appendChild(nameEl);
        popupContent.appendChild(document.createElement('br'));

        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.justifyContent = 'center';
        buttonContainer.style.alignItems = 'center';
        buttonContainer.style.marginTop = '5px';

        const editBtn = document.createElement('ion-button');
        editBtn.color = 'warning';
        editBtn.size = 'small';
        editBtn.innerHTML = '<ion-icon name="create" style="color: white;"></ion-icon>';
        editBtn.addEventListener('click', () => {
          this.navCtrl.navigateForward(`/createpoint/${key}`);
        });
        buttonContainer.appendChild(editBtn);

        const deleteBtn = document.createElement('ion-button');
        deleteBtn.color = 'danger';
        deleteBtn.size = 'small';
        deleteBtn.innerHTML = '<ion-icon name="trash" style="color: white;"></ion-icon>';
        deleteBtn.addEventListener('click', () => {
          this.presentDeleteConfirm(key);
        });
        buttonContainer.appendChild(deleteBtn);

        popupContent.appendChild(buttonContainer);

        marker.bindPopup(popupContent);
      }
    }
  }

  ionViewDidEnter() {
    if (!this.map) {
      this.map = L.map('map').setView([-7.7956, 110.3695], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(this.map);
    }

    this.reloadMarkers();
  }

  reloadMarkers() {
    // Remove existing markers
    this.map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        this.map.removeLayer(layer);
      }
    });

    // Load new markers
    this.loadPoints();
  }

  async presentDeleteConfirm(key: string) {
    const alert = await this.alertController.create({
      header: 'Hapus Point',
      message: 'Apakah anda yakin untuk menghapus point ini?',
      buttons: [
        {
          text: 'Batal',
          role: 'cancel',
          cssClass: 'secondary',
        }, {
          text: 'Hapus',
          handler: () => {
            this.deletePoint(key);
          }
        }
      ]
    });

    await alert.present();
  }

  deletePoint(key: string) {
    this.dataService.deletePoint(key).then(() => {
      this.map.closePopup();
      this.reloadMarkers();
    }).catch(error => {
      console.error("Error deleting point: ", error);
    });
  }

  ngOnInit() {
  }
}