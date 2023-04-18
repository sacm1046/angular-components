import { Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

interface Validation {
  type: "error" | "warning"
  name: "startAt" | "endAt" | "workday"
  message?: string
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  minDate = new Date()
  maxDate = new Date("2024-04-10")

  profileForm = new FormGroup({
    today: new FormControl(''),
  });

  validations: Validation[] = [
    { type: "warning", name: 'startAt', message: "Plazo mínimo de 7 días."},
    { type: "warning", name: 'endAt', message: "Plazo máximo de 360 días."},
    { type: "error", name: 'workday', message: "El vencimiento debe ser en un día hábil."},
  ]
}
