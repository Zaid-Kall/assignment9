// One shared toJSON transform used by every schema:
// _id becomes a string called id, and _id and __v are removed.
export function cleanJSON(doc, ret) {
  ret.id = ret._id.toString();
  delete ret._id;
  delete ret.__v;
  return ret;
}