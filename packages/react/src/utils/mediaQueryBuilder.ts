export type Device = "handheld" | "screen" | "tv" | "all";
export type Orientation = "portrait" | "landscape";
export type MediaFeature = 
  | 'min-width'
  | 'max-width'
  | 'min-height'
  | 'max-height'
  | 'min-device-width'
  | 'max-device-width'
  | 'device-width'
  | 'device-height'
  | 'orientation'
  | 'max-resolution'
  | 'min-resolution'
  | 'resolution'
  | '-webkit-min-device-pixel-ratio'
  | 'min--moz-device-pixel-ratio'
  | '-o-min-device-pixel-ratio'
  | 'min-device-pixel-ratio';

export type MediaFeatureObject =  {
  [key in MediaFeature]?: string | Orientation;
}

export class MediaQueryBuilder {
  private devices: Device[] = [];
  private features: MediaFeatureObject[] = [];
  private only: boolean = false;
  private operator: "and" | "or" = "and";

  // Add device(s) like "screen" or "tv"
  addDevice(device: Device | Device[]): this {
    if (Array.isArray(device)) {
      this.devices.push(...device);
    } else {
      this.devices.push(device);
    }
    return this;
  }

  // Add feature(s) as an object or an array of objects
  addFeature(featureObj: MediaFeatureObject | MediaFeatureObject[]): this {
    if (Array.isArray(featureObj)) {
      this.features.push(...featureObj);
    } else {
      this.features.push(featureObj);
    }
    return this;
  }

  // Set only keyword
  setOnly(only: boolean = true): this {
    this.only = only;
    return this;
  }

  // Set operator for joining features ("and", "or")
  setOperator(operator: "and" | "or"): this {
    if (operator !== "and" && operator !== "or") {
      throw new Error('Operator must be "and" or "or"');
    }
    this.operator = operator;
    return this;
  }

  // Create the final media query string
  build(): string {
    const mediaTypes = this.devices.join(', ');
    const onlyPrefix = this.only ? "only " : "";
    const operatorSeparator = this.operator === "and" ? " and " : " or ";

    const conditionsString = this.features.map(featureObj => {
      return Object.entries(featureObj).map(([feature, value]) => {
        return `(${feature}: ${value})`;
      }).join(operatorSeparator);
    }).join(operatorSeparator);

    return `@media ${onlyPrefix}${mediaTypes ? mediaTypes + " and " : ""}${conditionsString}`;
  }
}