import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/common/DashboardLayout';
import { createNeed, getNeedById, updateNeed } from '../../services/postService';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { getReceiverSidebarLinks } from '../../config/dashboardNav';

const categories = ['food', 'clothing', 'furniture', 'electronics', 'medical', 'books', 'other'];

const urgencyOptions = [
  { value: 'critical', title: 'Critical', description: 'Immediate action required', active: 'border-red-400 bg-red-50 text-red-700' },
  { value: 'high', title: 'High', description: 'Needed within days', active: 'border-orange-400 bg-orange-50 text-orange-700' },
  { value: 'medium', title: 'Medium', description: 'Needed within weeks', active: 'border-yellow-400 bg-yellow-50 text-yellow-700' },
  { value: 'low', title: 'Low', description: 'No immediate urgency', active: 'border-gray-400 bg-gray-50 text-gray-700' }
];

const initialFormState = {
  title: '',
  description: '',
  category: '',
  quantity: '',
  unit: '',
  urgency: '',
  location: {
    city: '',
    state: '',
    pincode: ''
  },
  images: [],
  tags: []
};

const normalizeImages = (images = []) =>
  images
    .map((image, index) => {
      const url = typeof image === 'string' ? image : image?.url;
      if (!url) return null;
      return {
        id: `existing-${index}-${url}`,
        type: 'existing',
        url
      };
    })
    .filter(Boolean);

const getErrorClass = (hasError) =>
  `w-full rounded-lg border px-3 py-2 text-sm outline-none ${
    hasError ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-green-500'
  }`;

export default function NeedPostFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const { unreadCount } = useSocket();

  const isEditMode = location.pathname.includes('/dashboard/receiver/needs/edit/') && !!id;
  const sidebarLinks = useMemo(() => getReceiverSidebarLinks(unreadCount, user), [unreadCount, user]);

  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [tagInput, setTagInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEditMode);
  const [isDragging, setIsDragging] = useState(false);

  const imagesRef = useRef([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    imagesRef.current = formData.images;
  }, [formData.images]);

  useEffect(
    () => () => {
      imagesRef.current.forEach((image) => {
        if (image?.type === 'new' && image?.url) {
          URL.revokeObjectURL(image.url);
        }
      });
    },
    []
  );

  useEffect(() => {
    if (!isEditMode || !id) return;

    const loadNeed = async () => {
      try {
        const response = await getNeedById(id);
        const post = response?.data?.data || response?.data || {};
        setFormData({
          title: post?.title || '',
          description: post?.description || '',
          category: post?.category || '',
          quantity: post?.quantityNeeded != null ? String(post.quantityNeeded) : post?.quantity ? String(post.quantity) : '',
          unit: post?.unit || '',
          urgency: post?.urgency || '',
          location: {
            city: post?.location?.city || '',
            state: post?.location?.state || '',
            pincode: post?.location?.pincode || ''
          },
          images: normalizeImages(post?.images),
          tags: Array.isArray(post?.tags) ? post.tags : []
        });
      } catch (error) {
        console.error('Failed to load need post:', error);
        toast.error('Failed to load need post');
        navigate('/dashboard/receiver/needs');
      } finally {
        setLoading(false);
      }
    };

    loadNeed();
  }, [id, isEditMode, navigate]);

  const addFilesToImages = (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;

    const remaining = 6 - formData.images.length;
    if (remaining <= 0) {
      toast.error('Maximum 6 images allowed');
      return;
    }

    const acceptedFiles = files.slice(0, remaining);
    if (files.length > remaining) {
      toast.error(`Only ${remaining} image${remaining > 1 ? 's' : ''} can be added`);
    }

    const nextImages = acceptedFiles.map((file, index) => ({
      id: `new-${Date.now()}-${index}`,
      type: 'new',
      file,
      url: URL.createObjectURL(file)
    }));

    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...nextImages]
    }));
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    addFilesToImages(event.dataTransfer.files);
  };

  const handleRemoveImage = (imageId) => {
    setFormData((prev) => {
      const imageToRemove = prev.images.find((image) => image.id === imageId);
      if (imageToRemove?.type === 'new' && imageToRemove?.url) {
        URL.revokeObjectURL(imageToRemove.url);
      }
      return {
        ...prev,
        images: prev.images.filter((image) => image.id !== imageId)
      };
    });
  };

  const addTag = (rawTag) => {
    const tag = rawTag.trim();
    if (!tag) return;

    setFormData((prev) => {
      const exists = prev.tags.some((existingTag) => existingTag.toLowerCase() === tag.toLowerCase());
      if (exists) return prev;
      return { ...prev, tags: [...prev.tags, tag] };
    });
    setTagInput('');
  };

  const validate = () => {
    const nextErrors = {};
    if (!formData.title.trim()) nextErrors.title = 'Title is required';
    if (!formData.description.trim()) nextErrors.description = 'Description is required';
    if (!formData.category) nextErrors.category = 'Category is required';
    if (!formData.quantity || Number(formData.quantity) < 1) nextErrors.quantity = 'Quantity is required';
    if (!formData.unit.trim()) nextErrors.unit = 'Unit is required';
    if (!formData.urgency) nextErrors.urgency = 'Urgency is required';
    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const payload = new FormData();
    payload.append('title', formData.title.trim());
    payload.append('description', formData.description.trim());
    payload.append('category', formData.category);
    payload.append('quantityNeeded', String(formData.quantity));
    payload.append('unit', formData.unit.trim());
    payload.append('urgency', formData.urgency);
    payload.append('location[city]', formData.location.city.trim());
    payload.append('location[state]', formData.location.state.trim());
    payload.append('location[pincode]', formData.location.pincode.trim());
    payload.append('tags', JSON.stringify(formData.tags));

    formData.images
      .filter((image) => image.type === 'new' && image.file)
      .forEach((image) => payload.append('images', image.file));

    const existingImages = formData.images
      .filter((image) => image.type === 'existing')
      .map((image) => image.url);
    payload.append('existingImages', JSON.stringify(existingImages));

    setSubmitting(true);
    try {
      if (isEditMode && id) {
        await updateNeed(id, payload);
        toast.success('Post updated!');
      } else {
        await createNeed(payload);
        toast.success('Post created!');
      }
      navigate('/dashboard/receiver/needs');
    } catch (error) {
      console.error('Need form submit failed:', error);
      toast.error(error?.response?.data?.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const imageLimitReached = formData.images.length >= 6;

  if (loading) {
    return (
      <DashboardLayout sidebarLinks={sidebarLinks} pageTitle={isEditMode ? 'Edit Need Post' : 'Create Need Post'}>
        <div className="mx-auto max-w-2xl rounded-xl border border-gray-200 bg-white p-6">
          <div className="space-y-4 animate-pulse">
            <div className="h-6 w-1/3 rounded bg-gray-200" />
            <div className="h-10 w-full rounded bg-gray-100" />
            <div className="h-24 w-full rounded bg-gray-100" />
            <div className="h-10 w-full rounded bg-gray-100" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout sidebarLinks={sidebarLinks} pageTitle={isEditMode ? 'Edit Need Post' : 'Create Need Post'}>
      <form onSubmit={handleSubmit} className="mx-auto max-w-2xl rounded-xl border border-gray-200 bg-white p-6">
        <section className="mb-6">
          <h2 className="mb-3 text-base font-semibold text-gray-900">Basic Info</h2>
          <div className="space-y-3">
            <div>
              <input
                type="text"
                value={formData.title}
                onChange={(event) => setFormData((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="e.g. Need 100 Meals for Flood Victims"
                className={getErrorClass(errors.title)}
                required
              />
              {errors.title ? <p className="mt-1 text-xs text-red-500">{errors.title}</p> : null}
            </div>
            <div>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
                className={getErrorClass(errors.description)}
                required
              />
              {errors.description ? <p className="mt-1 text-xs text-red-500">{errors.description}</p> : null}
            </div>
            <div>
              <select
                value={formData.category}
                onChange={(event) => setFormData((prev) => ({ ...prev, category: event.target.value }))}
                className={getErrorClass(errors.category)}
                required
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              {errors.category ? <p className="mt-1 text-xs text-red-500">{errors.category}</p> : null}
            </div>
          </div>
        </section>

        <section className="mb-6">
          <h2 className="mb-3 text-base font-semibold text-gray-900">Need Details</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <input
                type="number"
                min={1}
                value={formData.quantity}
                onChange={(event) => setFormData((prev) => ({ ...prev, quantity: event.target.value }))}
                className={getErrorClass(errors.quantity)}
                required
                placeholder="Quantity Needed"
              />
              {errors.quantity ? <p className="mt-1 text-xs text-red-500">{errors.quantity}</p> : null}
            </div>
            <div>
              <input
                type="text"
                placeholder="pcs, kg, boxes, meals, etc."
                value={formData.unit}
                onChange={(event) => setFormData((prev) => ({ ...prev, unit: event.target.value }))}
                className={getErrorClass(errors.unit)}
                required
              />
              {errors.unit ? <p className="mt-1 text-xs text-red-500">{errors.unit}</p> : null}
            </div>
          </div>

          <div className="mt-4">
            <p className="mb-2 text-sm font-medium text-gray-700">Urgency</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {urgencyOptions.map((option) => {
                const active = formData.urgency === option.value;
                return (
                  <label
                    key={option.value}
                    className={`cursor-pointer rounded-xl border p-4 transition ${
                      active ? option.active : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="urgency"
                      value={option.value}
                      checked={active}
                      onChange={(event) => setFormData((prev) => ({ ...prev, urgency: event.target.value }))}
                      className="sr-only"
                    />
                    <p className="text-sm font-semibold">{option.title}</p>
                    <p className="mt-1 text-xs">{option.description}</p>
                  </label>
                );
              })}
            </div>
            {errors.urgency ? <p className="mt-1 text-xs text-red-500">{errors.urgency}</p> : null}
          </div>
        </section>

        <section className="mb-6">
          <h2 className="mb-3 text-base font-semibold text-gray-900">Location</h2>
          <div className="grid gap-3 md:grid-cols-3">
            <input
              type="text"
              placeholder="City"
              value={formData.location.city}
              onChange={(event) =>
                setFormData((prev) => ({
                  ...prev,
                  location: { ...prev.location, city: event.target.value }
                }))
              }
              className={getErrorClass(false)}
            />
            <input
              type="text"
              placeholder="State"
              value={formData.location.state}
              onChange={(event) =>
                setFormData((prev) => ({
                  ...prev,
                  location: { ...prev.location, state: event.target.value }
                }))
              }
              className={getErrorClass(false)}
            />
            <input
              type="text"
              placeholder="Pincode"
              value={formData.location.pincode}
              onChange={(event) =>
                setFormData((prev) => ({
                  ...prev,
                  location: { ...prev.location, pincode: event.target.value }
                }))
              }
              className={getErrorClass(false)}
            />
          </div>
        </section>

        <section className="mb-6">
          <h2 className="mb-3 text-base font-semibold text-gray-900">Images (max 6)</h2>
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`rounded-lg border-2 border-dashed p-5 text-center ${
              isDragging ? 'border-green-400 bg-green-50' : 'border-gray-300'
            }`}
          >
            <p className="mb-3 text-sm text-gray-600">Drag and drop images here, or click to browse</p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={imageLimitReached}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Browse Images
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(event) => {
                addFilesToImages(event.target.files);
                event.target.value = '';
              }}
              disabled={imageLimitReached}
            />
          </div>

          {formData.images.length > 0 ? (
            <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
              {formData.images.map((image) => (
                <div key={image.id} className="relative">
                  <img src={image.url} alt="Upload preview" className="h-20 w-full rounded object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(image.id)}
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-xs text-white"
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </section>

        <section className="mb-6">
          <h2 className="mb-3 text-base font-semibold text-gray-900">Tags</h2>
          <input
            type="text"
            value={tagInput}
            onChange={(event) => setTagInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ',') {
                event.preventDefault();
                addTag(tagInput);
              }
            }}
            onBlur={() => addTag(tagInput)}
            placeholder="Type a tag and press Enter or comma"
            className={getErrorClass(false)}
          />
          {formData.tags.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        tags: prev.tags.filter((existingTag) => existingTag !== tag)
                      }))
                    }
                    className="text-green-700"
                  >
                    x
                  </button>
                </span>
              ))}
            </div>
          ) : null}
        </section>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard/receiver/needs')}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Saving...
              </>
            ) : isEditMode ? (
              'Save Changes'
            ) : (
              'Post Need'
            )}
          </button>
        </div>
      </form>
    </DashboardLayout>
  );
}
