import { Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

interface Validation {
  type: "error" | "warning"
  name?: "startAt" | "endAt" | "workday"
  value?: number
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
    { type: "warning", name: 'startAt', value: 0},
    { type: "warning", name: 'endAt', value: 365},
    { type: "error", name: 'workday'},
  ]

}
