
export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  requestResourceData?: any;
};

export class FirestorePermissionError extends Error {
  public context: SecurityRuleContext;

  constructor(context: SecurityRuleContext) {
    const message = `Firestore Permission Denied: Cannot ${context.operation} on ${context.path}.`;
    super(message);
    this.name = "FirestorePermissionError";
    this.context = context;
  }

  toObject() {
    return {
      message: this.message,
      name: this.name,
      context: this.context,
    };
  }
}
