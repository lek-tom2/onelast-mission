GET /neo_data_per_object/
Endpoint Description

The get_neo_per_object endpoint is the most powerful and useful endpoint in this API. It aggregates orbital data for all Near Earth Objects within a specified date range and returns a consolidated view of their orbital parameters.
URL
text

GET /neo_data_per_object/?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD

Parameters
Parameter	Type	Required	Description	Example
start_date	string	✅	Start date in YYYY-MM-DD format	2025-01-01
end_date	string	✅	End date in YYYY-MM-DD format	2025-01-07
Workflow

    Fetch NEOs by Date Range: Calls NASA API to get all NEOs between start and end dates

    Extract NEO IDs: Collects unique identifiers for all discovered objects

    Fetch Detailed Orbital Data: Makes individual API calls for each NEO to get comprehensive orbital parameters

    Structure Response: Organizes data by object name for easy access

Response Structure
json

{
  "Object Name": {
    "orbit_id": "string",
    "orbit_determination_date": "string",
    "first_observation_date": "string",
    "last_observation_date": "string",
    "data_arc_in_days": integer,
    "observations_used": integer,
    "orbit_uncertainty": "string",
    "minimum_orbit_intersection": "string",
    "jupiter_tisserand_invariant": "string",
    "epoch_osculation": "string",
    "eccentricity": "string",
    "semi_major_axis": "string",
    "inclination": "string",
    "ascending_node_longitude": "string",
    "orbital_period": "string",
    "perihelion_distance": "string",
    "perihelion_argument": "string",
    "aphelion_distance": "string",
    "perihelion_time": "string",
    "mean_anomaly": "string",
    "mean_motion": "string",
    "equinox": "string",
    "orbit_class": {
      "orbit_class_type": "string",
      "orbit_class_description": "string",
      "orbit_class_range": "string"
    }
  }
}

Key Orbital Parameters Explained
Risk Assessment

    minimum_orbit_intersection: Closest possible approach to Earth (AU) - values < 0.05 indicate Potentially Hazardous Asteroids

    orbit_uncertainty: Data reliability (0-9 scale, 0=most reliable)

Orbital Characteristics

    eccentricity: Orbit shape (0=circular, 0-1=elliptical)

    semi_major_axis: Orbit size (AU)

    inclination: Orbital tilt relative to Earth's plane (degrees)

    orbital_period: Time for one complete orbit (days)

Classification

    orbit_class_type:

        ATE (Aten): Orbits mostly inside Earth's orbit

        APO (Apollo): Orbits that cross Earth's orbit

        AMO (Amor): Orbits entirely outside Earth's orbit

Example Usage
Request
bash

curl "http://127.0.0.1:8000/neo_data_per_object/?start_date=2025-01-01&end_date=2025-01-07"

Response Example
json

{
  "(2008 SS)": {
    "orbit_id": "17",
    "orbit_determination_date": "2025-09-26 06:51:54",
    "minimum_orbit_intersection": ".0448952",
    "orbit_uncertainty": "0",
    "eccentricity": ".479246673866332",
    "semi_major_axis": ".9285116827289324",
    "inclination": "21.13952185099964",
    "orbit_class": {
      "orbit_class_type": "ATE",
      "orbit_class_description": "Near-Earth asteroid orbits similar to that of 2062 Aten"
    }
  }
}