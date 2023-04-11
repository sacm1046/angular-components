import { Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

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


}
