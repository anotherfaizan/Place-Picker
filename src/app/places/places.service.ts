import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, tap, throwError } from 'rxjs';

import { ErrorService } from '../shared/error.service';
import { Place } from './place.model';

@Injectable({
  providedIn: 'root',
})
export class PlacesService {
  private errorService = inject(ErrorService);
  private userPlaces = signal<Place[]>([]);
  httpClient = inject(HttpClient);

  loadedUserPlaces = this.userPlaces.asReadonly();

  loadAvailablePlaces() {
    return this.fetchPlaces(
      'http://localhost:3000/places',
      'Something went wrong. Please try again later!'
    );
  }

  loadUserPlaces() {
    return this.fetchPlaces(
      'http://localhost:3000/user-places',
      'Something went wrong fetching favorite places. Please try again later!'
    ).pipe(
      tap({
        next: (userPlaces) => this.userPlaces.set(userPlaces),
      })
    );
  }

  addPlaceToUserPlaces(selectedPlace: Place) {
    const prevUserPlaces = this.userPlaces();

    if (!prevUserPlaces.some((p) => p.id === selectedPlace.id)) {
      this.userPlaces.set([...prevUserPlaces, selectedPlace]);
    }

    return this.httpClient
      .put('http://localhost:3000/user-places', {
        placeId: selectedPlace.id
      })
      .pipe(
        catchError((error) => {
          this.userPlaces.set(prevUserPlaces);
          this.errorService.showError('Failed to store selected place!');
          return throwError(() => new Error('Failed to store selected place!'));
        })
      )
  }

  removeUserPlace(place: Place) {
    const prevUserPlaces = this.userPlaces();

    if (prevUserPlaces.some((p) => p.id === place.id)) {
      this.userPlaces.set(prevUserPlaces.filter((p) => p.id !== place.id));
    }

    return this.httpClient
      .delete('http://localhost:3000/user-places/' + place.id)
      .pipe(
        catchError((error) => {
          this.userPlaces.set(prevUserPlaces);
          this.errorService.showError('Failed to delete the selected place!');
          return throwError(() => new Error('Failed to delete the selected place!'));
        })
      )
  }

  private fetchPlaces(url: string, errorMessage: string) {
    return this.httpClient
      .get<{ places: Place[] }>(url)
      .pipe(
        map((resData) => resData.places),
        catchError((error) => {
          console.log(error);
          return throwError(() =>
            new Error(
              errorMessage
            )
          )
        })
      )
  }
}
