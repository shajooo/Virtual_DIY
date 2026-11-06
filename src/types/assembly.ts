export interface Assembly {
  id: string;
  name: string;
  componentIds: string[]; // Part IDs
  visible: boolean;
}
