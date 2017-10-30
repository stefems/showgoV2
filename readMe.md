Installation Requirements
- node/npm
- mongo
- my env files that you shouldn't have

To Do:
- consider using react for easier component usage
- map out the core UI and consider the different components
- seeding process!
  - FE: get their lat/lng when they login and save to the user doc
  - FE: send request to get feed
  - BE: uses their location to look in the DB for events
  - BE: generates list of songs based on the bands playing in those events
  - FE: uses the list of songs in the spotify player w/ concert info nearby



Continuous TODO Notes:
- Is it a good idea to send a separate request with the location data after they've logged in?
