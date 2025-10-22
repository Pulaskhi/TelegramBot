module.exports = async (req, res, next) => {
  try {
    const rawIp = req.ip || '';
    const userIp = rawIp.replace('::ffff:', '');

    // Evita geolocalizar IPs privadas o locales
    const isPrivateIp =
      userIp === '127.0.0.1' ||
      userIp === '::1' ||
      userIp.startsWith('192.168.') ||
      userIp.startsWith('10.') ||
      userIp.startsWith('172.16.');

    if (isPrivateIp) {
      console.log(`UserIp local o privada detectada: ${userIp} (no se geolocaliza)`);
      return next();
    }

    console.log(`UserIp pública: ${userIp}`);

    const response = await fetch(`http://ip-api.com/json/${userIp}`);
    const result = await response.json();

    if (result.status === 'fail') {
      console.log(`No se pudo geolocalizar IP (${result.message})`);
    } else {
      console.log(`Ubicación detectada: ${result.city}, ${result.country}`);
    }

    req.userLocation = result;
  } catch (error) {
    console.error('Error en user-tracking:', error.message);
  }

  next();
};
