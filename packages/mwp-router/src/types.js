import {
  shape,
  bool,
  string,
  objectOf,
} from "prop-types";

export const Match = shape({
  params: objectOf(string),
  isExact: bool,
  path: string,
  url: string
});
