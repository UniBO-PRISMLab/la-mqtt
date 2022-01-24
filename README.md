# Location Aware MQTT Protocol (la-mqtt)

## About
The repo contains the source code of the **la-mqtt** project, an extension of the popular MQTT protocol for *spatial-aware IoT communications*.

In few words, **la-mqtt** enables to route the data generated by service producers only to consumers for which such data is relevant in terms of both topic and location; 
hence, it limits the amount of consumers to be notified to only the ones that are geographically inside the area of competence defined by the service producer. 

Main features:
- Topic+Location based notifications
- Location privacy support
- QoS/privacy trade-off handling
- MQTT broker agnostic
- Fully backward compatibility with the standard MQTT

For more information about the **la-mqtt**' operations and performance, please refer to the scientific article below:

Federico Montori, Lorenzo Gigli, Luca Sciullo, Marco Di Felice, *LA-MQTT: Location-aware publish-subscribe communications forthe Internet of Things*, submitted for publication in the 
ACM Transactions on Internet of Things (TIOT), 2021.

