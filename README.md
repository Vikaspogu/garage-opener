<h1>
  Garage door opener
  <br />
</h1>
<br />
<div>

[![GitHub last commit](https://img.shields.io/github/last-commit/vikaspogu/garage?color=purple&style=flat-square)](https://github.com/vikaspogu/garage/commits/master) [![Docker Build Status](https://github.com/vikaspogu/garage/workflows/push_latest/badge.svg)](https://github.com/vikaspogu/garage/actions)

</div>

---

# Overview

A Node.js, Rest and MQTT based garage door opener. This project is compatible with Home Assistant's "MQTT Cover" platform. It responds to HASS's open and close commands and reports door status to keep HASS's GUI in sync with the door state. This project is deployed as a container in kubernetes cluster.

[NodeJS setup with GPIO interface](https://vikaspogu.dev/posts/pi-garage-k3s/)

## Configuring Home Assistant

### MQTT Cover: Complete configuration

```
cover:
  - platform: mqtt
    name: "Garage Door"
    command_topic: "garage/set"
    state_topic: "garage/state"
    availability:
      - topic: "garage/availability"
    qos: 0
    retain: true
    payload_open: "OPEN"
    payload_close: "CLOSE"
    state_open: "open"
    state_opening: "opening"
    state_closed: "closed"
    state_closing: "closing"
    payload_available: "online"
    payload_not_available: "offline"
    value_template: >-
      {% if value == 'open' or value == 'opening' %}
        open
      {% elif value == 'close' or value == 'closed' %}
        closed
      {% else %}
        Unknown
      {% endif %}
```

### HASS Automations

Automation is added to `automations.yaml`

#### Close garage door if open for longer than 15 minutes after 10PM and before 5AM

Place the following in your `automations.yaml`:

```
- alias: Close garage door if its open for 15 minutes after 10PM
  trigger:
    platform: state
    entity_id: cover.garage_door
    from: 'closed'
    to: 'open'
    for: '0:15:00'
  condition:
    condition: time
    after: '22:00:00'
    before: '05:00:00'
  action:
    service: cover.close_cover
    entity_id: cover.garage_door
    data: {}
```

Of course, you can replace `15` with any length of time in minutes you wish. Be sure to replace `cover.garage_door` if the name of your garage door in Home Assistant is different.

#### Notify device when garage door opens or closes

To use this automation, you must have the Home Assistant app installed on your phone. We'll use [notify](https://www.home-assistant.io/integrations/notify/) integration

Place the following in your `automations.yaml`:

```
- alias: Push notification when the garage door is open
  trigger:
    platform: state
    entity_id: cover.garage_door
    from: 'closed'
    to: 'open'
    for: '0:15:00'
  action:
    service: notify.mobile_app_<device> ## Mobile device
    data:
      message: "The garage has been left open"
      data:
        actions:
          - action: "close_garage"
            title: "Close Garage Door"
```

Replace `notify.your_device_name_here` with the name assigned to your device by Home Assistant, Be sure to replace `cover.garage_door` if the name of your garage door in Home Assistant is different.

Now, when your garage door has been open for 15 minutes, you will receive a Home Assistant notification saying "The garage has been left open", and the notification will contain a button labelled "Close Garage" which will close your garage when tapped.

#### Close button action

```
- alias: Actionable notification - close garage door
  trigger:
    platform: event
    event_type: mobile_app_notification_action
    event_data:
      action: close_garage
  action:
    service: cover.close_cover
    entity_id: cover.garage_door
    data: {}
```
