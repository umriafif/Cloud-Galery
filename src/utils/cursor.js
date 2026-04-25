function encodeCursor(payload) {
  if (!payload?.createdAt || !payload?.id) {
    return null;
  }

  const raw = `${new Date(payload.createdAt).toISOString()}|${payload.id}`;
  return Buffer.from(raw, 'utf8').toString('base64url');
}

function decodeCursor(value) {
  if (!value) {
    return null;
  }

  try {
    const decoded = Buffer.from(value, 'base64url').toString('utf8');
    const [createdAt, id] = decoded.split('|');
    const parsedDate = new Date(createdAt);
    const parsedId = Number(id);

    if (Number.isNaN(parsedDate.getTime()) || !Number.isInteger(parsedId)) {
      return null;
    }

    return {
      createdAt: parsedDate,
      id: parsedId
    };
  } catch (error) {
    return null;
  }
}

module.exports = {
  encodeCursor,
  decodeCursor
};
